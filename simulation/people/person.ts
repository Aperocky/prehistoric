import { RESOURCE_TYPE, PRODUCE_TYPE } from "../resources";
import * as firstnames from "../../assets/data/firstname_f.json";
import * as surnames from "../../assets/data/surnames.json";
import { v4 as uuid } from 'uuid';
import { ResourceMap } from "../../map/informationMap";
import { Point } from "../../map/mapUtil";
import { TYPE_MAP, PersonType } from "./person_types";
import { STRENGTH_MODIFIERS, RADIUS_MODIFIERS, PRIVATE_ENTEPRISE } from "./modifiers";
import * as lang from "../utilities/langutil";

const MORTALITY = "MORT";
const NO_CHANGE = "STAY";

export type TransactionRecord = {
    bought: { [resource: string] : number };
    sold: { [resource: string] : number };
}

export const DISPLAY_TYPE = {
    HUNT: "gatherer",
    FARM: "farmer",
    FISH: "fisher",
    TRAD: "trader",
    WHAL: "whaler",
    MORT: "deceased",
    WOOD: "lumberjack",
    TOOL: "craftswoman",
}

export type Person = {
    x: number;
    y: number;
    income: { [key: string]: number };
    deficit: { [key: string]: number };
    store: { [key: string]: number };
    type: string;
    name: string;
    unique_id: string;
    eventlog: string;
    age: number;
    // Market economy below
    surplus: { [resource: string] : number };
    demand: { [resource: string] : number };
    budget: { [resource: string] : number };
    transactions: {[key:string] : {[rtype: string] : number[] }};
}

export class PersonUtil {

    static move_person(person: Person, simulation): void {
        let north = ResourceMap.pointToStr(person.x, person.y + 1);
        let south = ResourceMap.pointToStr(person.x, person.y - 1);
        let west = ResourceMap.pointToStr(person.x + 1, person.y);
        let east = ResourceMap.pointToStr(person.x - 1, person.y);
        let tries = 0;
        while (tries < 3) {
            tries += 1;
            let decision: string = [north, east, west, south][Math.floor(Math.random()*4)];
            let building = simulation.building_by_location[decision];
            if (decision in simulation.map_cache && simulation.map_cache[decision].geography > 0) {
                if (building) {
                    if (building.type == "FARM" && person.type == "HUNT") {
                        // gatherer may not enter farms.
                        continue;
                    }
                }
                let newloc: Point = JSON.parse(decision);
                person.x = newloc.x;
                person.y = newloc.y;
                return;
            }
        }
    }

    static add_income_to_store(person: Person): void {
        for (let [income_type, income] of Object.entries(person.income)) {
            lang.add_value(person.store, income_type, income, "ADDING INCOME TO STORE");
        }
    }

    static consume(person: Person): void {
        let consumption = PersonUtil.get_consumption(person);
        let deficit = {};
        for (let [consume_type, consume_count] of Object.entries(consumption)) {
            if (consume_type in person.store) {
                if (consume_count < person.store[consume_type]) {
                    lang.add_value(person.store, consume_type, -consume_count, "CONSUMING FROM STORE");
                } else {
                    deficit[consume_type] = consume_count - person.store[consume_type];
                    person.store[consume_type] = 0;
                    person.eventlog += `She needs more ${deficit_complaints_map[consume_type]}. `
                }
            } else {
                deficit[consume_type] = consume_count;
                person.eventlog += `She lacks ${deficit_complaints_map[consume_type]}. `
            }
        }
        person.deficit = deficit;
    }

    static get_random_name(surname: boolean) : string {
        if (surname) {
            return surnames[Math.floor(Math.random() * surnames.length)]
        } else {
            return firstnames[Math.floor(Math.random() * firstnames.length)]
        }
    }

    static get_random_full_name() {
        return PersonUtil.get_random_name(false) + " " + PersonUtil.get_random_name(true);
    }

    static get_type_def(person: Person): PersonType {
        return TYPE_MAP[person.type];
    }

    static get_work_radius(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        let work_radius_mod = 0;
        if (person.type in RADIUS_MODIFIERS) {
            work_radius_mod = RADIUS_MODIFIERS[person.type](person);
        }
        return typedef.work_radius + work_radius_mod;
    }

    static get_work_strength(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        let work_strength_mod = 0;
        if (person.type in STRENGTH_MODIFIERS) {
            work_strength_mod = STRENGTH_MODIFIERS[person.type](person);
        }
        return typedef.work_strength + work_strength_mod;
    }

    static get_production_type(person: Person) {
        return PRODUCTION_TYPE_MAP[person.type];
    }

    static get_travel(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        return typedef.travel;
    }

    static get_home(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        return typedef.home;
    }

    static get_consumption(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        return typedef.consumption;
    }

    static get_draft(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        let draft_radius_mod = 0;
        if (person.type in RADIUS_MODIFIERS) {
            draft_radius_mod = RADIUS_MODIFIERS[person.type](person);
        } else {
            return typedef.draft;
        }
        let final_draft = JSON.parse(JSON.stringify(typedef.draft));
        for (let key of Object.keys(final_draft)) {
            final_draft[key][0] += draft_radius_mod;
        }
        return final_draft;
    }

    static run_change_func(person: Person, map_cache) {
        let typedef = PersonUtil.get_type_def(person);
        let pstatus = typedef.change_func(person, map_cache);
        // General change logic independent to types, reserved for MORTALITY
        // Starvation is bad for health
        if (Math.random() < person.deficit[RESOURCE_TYPE.FOOD]){
            person.eventlog = "She died of hunger. ";
            pstatus = MORTALITY;
        }
        // Ageing
        if (Math.random() * 60 < person.age - 60) {
            person.eventlog = "She died of old age. ";
            pstatus = MORTALITY;
        }
        if (pstatus == NO_CHANGE) {
            return;
        }
        person.eventlog += `She changed from ${DISPLAY_TYPE[person.type]} to ${DISPLAY_TYPE[pstatus]}. `;
        person.type = pstatus;
    }

    static create_new_person_from_parent(person: Person, replicate_cost: { [key: string]: number }): Person {
        let surname = person.name.split(" ")[1];
        let new_person : Person = {
            x: person.x,
            y: person.y,
            income: {},
            deficit: {},
            store: {},
            type: BIRTH_TYPE_MAP[person.type],
            name: PersonUtil.get_random_name(false) + " " + surname,
            unique_id: uuid(),
            eventlog: "",
            age: 0,
            surplus: {},
            demand: {},
            budget: {},
            transactions: {},
        }
        for (let [rtype, rcost] of Object.entries(replicate_cost)) {
            lang.add_value(person.store, rtype, -rcost, "GIVING BIRTH AND DISTRIBUTING TO CHILD");
            if (person.store[rtype] < 0) {
                person.type = MORTALITY;
            } else {
                person.store[rtype] /= 2
                new_person.store[rtype] = person.store[rtype];
            }
        }
        return new_person;
    }

    static run_replicate_func(person: Person): Person | null {
        if (person.age < 13 || person.age > 45) {
            return null;
        }
        let typedef = PersonUtil.get_type_def(person);
        if (typedef.replicate_func(person)) {
            let replicate_cost = typedef.replicate_cost;
            return PersonUtil.create_new_person_from_parent(person, replicate_cost);
        }
        return null;
    }

    static get_surplus_resources(person: Person) : { [resource: string] : number } {
        let surplus : { [resource: string] : number } = {};
        // Mark all over 10x of yearly consumption as for sale.
        for (let [rtype, rcount] of Object.entries(person.store)) {
            if (rtype == "GOLD") {
                continue; // DUH
            }
            if (rtype in PersonUtil.get_consumption(person)) {
                let currplus = rcount - PersonUtil.get_consumption(person)[rtype] * 10;
                if (currplus > 0) {
                    surplus[rtype] = currplus; // Portion of store more than 10 years
                }
            } else {
                if (rcount > 0) {
                    surplus[rtype] = rcount; // All of it, since it's not needed
                }
            }
        }
        // Mark all income over 50% yearly consumption for sale.
        for (let [rtype, rcount] of Object.entries(person.income)) {
            if (rtype == "GOLD") {
                continue; // DUH
            }
            if (rtype in PersonUtil.get_consumption(person)) {
                let currplus = rcount - PersonUtil.get_consumption(person)[rtype] * 1.5;
                if (currplus > 0) {
                    lang.add_value(surplus, rtype, currplus);
                }
            } else {
                // This person doesn't actually need this resource, mark all for sale
                lang.add_value(surplus, rtype, rcount);
            }
        }
        return surplus;
    }

    // Amount that would be preferably bought.
    static get_demand_resources(person: Person) : { [resource: string] : number } {
        let demand : { [resource: string] : number } = {};
        // Demand for things without 5 years supply and up to 50% more than consumption
        for (let [rtype, rcount] of Object.entries(PersonUtil.get_consumption(person))) {
            if (rtype == "GOLD") {
                continue; // DUH
            }
            if (rtype in person.store) {
                let demandMultiplier = 2 - person.store[rtype]/(rcount*7.5);
                demandMultiplier = demandMultiplier < 0 ? 0 : demandMultiplier;
                let rawDemand = rcount * 1.5;
                if (rtype in person.income) {
                    rawDemand -= person.income[rtype];
                }
                rawDemand = rawDemand > 0 ? rawDemand : 0;
                if (rawDemand == 0) {
                    continue; // This spare subsequent calculations
                }
                demand[rtype] = rawDemand * demandMultiplier;
            } else {
                demand[rtype] = rcount * 3;
            }
        }
        return demand;
    }

    static get_available_budget(person: Person) : { [resource: string] : number } {
        let budget : { [resource: string] : number } = {};
        let credit_line: number = person.store["GOLD"] ? person.store["GOLD"] : 0;
        if (credit_line == 0) { return {}; }
        if ("FOOD" in person.deficit) {
            // Mortal danger, all gold goes to food.
            budget["FOOD"] = credit_line;
            return budget;
        }
        // Willing to spend demand/consumption*0.5 of all gold on deficits.
        // Since there can be multiple resources, the potential budget is larger than store
        // But that's fine since this is not an distributing function
        // Market economy at work baby!
        for (let [rtype, rcount] of Object.entries(person.demand)) {
            let consumption = PersonUtil.get_consumption(person)[rtype];
            let spendVal = rcount/consumption * 0.5 * credit_line;
            budget[rtype] = spendVal;
        }
        return budget;
    }

    static get_food_draft_type(person: Person) : string {
        if (person.type in FOOD_DRAFT_TYPE) {
            return FOOD_DRAFT_TYPE[person.type];
        }
        return "LAND"; // Placeholder
    }

    // For independent production methods
    static private_enteprise(person: Person) : void {
        if (person.type in PRIVATE_ENTEPRISE) {
            let resource_type = PRODUCE_TYPE[PRODUCTION_TYPE_MAP[person.type]];
            let resource_production = PRIVATE_ENTEPRISE[person.type](person);
            lang.add_value(person.income, resource_type, resource_production, "ENTEPRISE");
        }
    }

    static get_net_worth(person: Person, mc) : number {
        let net_worth = 0;
        for (let [rtype, rcount] of Object.entries(person.store)) {
            if (rtype == "GOLD") {
                net_worth += rcount;
            } else {
                net_worth += mc.pricing[rtype] * rcount;
            }
        }
        return net_worth;
    }
}

const FOOD_DRAFT_TYPE = {
    HUNT: "LAND",
    FARM: "LAND",
    FISH: "WATER",
    WHAL: "WATER",
}

const PRODUCTION_TYPE_MAP = {
    HUNT: "HUNT",
    FARM: "FARM",
    FISH: "FISH",
    TRAD: "TRAD",
    WHAL: "FISH",
    WOOD: "WOOD",
    TOOL: "TOOL",
}

const BIRTH_TYPE_MAP = {
    HUNT: "HUNT",
    FARM: "FARM",
    FISH: "FISH",
    TRAD: "TRAD",
    WHAL: "FISH",
    WOOD: "HUNT",
    TOOL: "TOOL",
}

const deficit_complaints_map = {
    "FOOD" : "food",
    "WOOD" : "wood",
    "TOOL" : "tooling",
}