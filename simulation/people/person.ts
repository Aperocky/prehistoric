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

export const DISPLAY_TYPE = {
    HUNT: "gatherer",
    FARM: "farmer",
    FISH: "fisher",
    TRAD: "trader",
    MORT: "deceased",
    WOOD: "lumberjack",
    TOOL: "craftswoman",
}

export type MarketPack = {
    surplus: { [resource: string] : number };
    demand: { [resource: string] : number };
    budget: { [resource: string] : number };
    transactions: {[key:string] : {[rtype: string] : number[] }};
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
    market: MarketPack;
//    surplus: { [resource: string] : number };
//    demand: { [resource: string] : number };
//    budget: { [resource: string] : number };
//    transactions: {[key:string] : {[rtype: string] : number[] }};
    family_support: {[key:string] : {[rtype: string] : number }};
}

export class PersonUtil {

    static init_market_pack(): MarketPack {
        return {
            surplus: {},
            demand: {},
            budget: {},
            transactions: {},
        }
    }

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
        if (person.type == MORTALITY) {
            return;
        }
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

        // Things go bad!
        for (let rtype of Object.keys(person.store)) {
            person.store[rtype] = person.store[rtype] * 0.9;
        }
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
        // Add age constraints.
        let age_modifier = 1;
        if (person.age < 15) {
            if (person.age < 6) {
                age_modifier = 0;
            } else {
                age_modifier = (person.age - 5) * 0.1;
            }
        }
        return (typedef.work_strength + work_strength_mod) * age_modifier;
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

    static get_consumption(person: Person) : { [key: string]: number } {
        let typedef = PersonUtil.get_type_def(person);
        // Add age into consideration.
        // Children take child-sized meals
        // Until age of 10, they don't consume other things
        if (person.age > 15) {
            return typedef.consumption;
        } else {
            let modconsumption = JSON.parse(JSON.stringify(typedef.consumption));
            let isBaby = person.age < 10;
            for (let key in modconsumption) {
                if (key != "FOOD" && isBaby) {
                    modconsumption[key] = 0;
                }
                modconsumption[key] *= 0.4 + person.age/25;
            }
            return modconsumption;
        }
    }

    static get_draft(person: Person, genealogy) {
        let typedef = PersonUtil.get_type_def(person);
        let draft_radius_mod = 0;
        if (person.type in RADIUS_MODIFIERS) {
            draft_radius_mod = RADIUS_MODIFIERS[person.type](person);
        }
        let final_draft = JSON.parse(JSON.stringify(typedef.draft));
        for (let key of Object.keys(final_draft)) {
            final_draft[key][0] += draft_radius_mod;
        }
        // Age and child modifiers, younger ones gets less, recent parents get more.
        let age_modifier = 1;
        if (person.age < 25) {
            if (person.age < 6) {
                age_modifier = 0;
            } else {
                age_modifier = (person.age - 5) * 0.05;
            }
        }
        let child_ages = genealogy.get_children(person).map(c => genealogy.turn_num - c.bturn);
        let child_modifier = child_ages.reduce((sum, curr) => {
            let currmod = (17-curr)*0.03; // Most compensation at young age, reduce to 0 at 17.
            return sum + (currmod > 0 ? currmod : 0);
        }, 0);
        let total_modifiers = age_modifier + child_modifier;
        for (let key of Object.keys(final_draft)) {
            final_draft[key][1] *= total_modifiers;
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
            market: PersonUtil.init_market_pack(),
            family_support: {},
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

    static run_replicate_func(person: Person, genealogy): Person | null {
        if (person.age < 13 || person.age > 45) {
            return null;
        }
        let child_count = genealogy.records[person.unique_id].children.length;
        let chance_base = (20 - child_count)/20;
        let y_factor = person.age > 20 ? 0 : (20 - person.age)/7;
        let o_factor = person.age < 35 ? 0 : (person.age - 35)/10;
        let rest_chance = (chance_base - y_factor - o_factor)*0.6;
        let typedef = PersonUtil.get_type_def(person);
        if (typedef.replicate_func(person) && Math.random() < rest_chance) {
            let replicate_cost = {FOOD: 0.5};
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
            // Do not double count current year income
            if (rtype in person.income) {
                rcount -= person.income[rtype];
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
        // Mark all income over 50% yearly need for sale.
        for (let [rtype, rcount] of Object.entries(person.income)) {
            if (rtype == "GOLD") {
                continue; // DUH
            }
            let actual_need = 0;
            if (rtype in PersonUtil.get_consumption(person)) {
                actual_need += PersonUtil.get_consumption(person)[rtype];
            }
            if (rtype in person.family_support["SUPPORT"]) {
                actual_need += person.family_support["SUPPORT"][rtype];
            }
            let currplus = rcount - actual_need * 1.5;
            if (currplus > 0) {
                lang.add_value(surplus, rtype, currplus);
            }
        }
        return surplus;
    }

    // Amount that would be preferably bought.
    static get_demand_resources(person: Person, genealogy) : { [resource: string] : number } {
        let demand : { [resource: string] : number } = {};
        // Demand for things without 5 years supply and up to 50% more than consumption
        for (let [rtype, rcount] of Object.entries(PersonUtil.get_consumption(person))) {
            if (rtype == "GOLD") {
                continue; // DUH
            }
            if (rcount == 0) {
                continue; // No actual demand
            }
            let child_ages = genealogy.get_children(person).map(c => genealogy.turn_num - c.bturn);
            let child_modifier = child_ages.reduce((sum, curr) => sum + curr > 16 ? 0 : 0.5, 0);
            if (rtype in person.store) {
                let demandMultiplier = 2 - person.store[rtype]/(rcount*6);
                demandMultiplier = demandMultiplier < 0 ? 0 : demandMultiplier;
                let rawDemand = rcount * (1.5 + child_modifier);
                if (rtype in person.income) {
                    rawDemand -= person.income[rtype];
                }
                rawDemand = rawDemand > 0 ? rawDemand : 0;
                if (rawDemand == 0) {
                    continue; // This spare subsequent calculations
                }
                demand[rtype] = rawDemand * demandMultiplier;
            } else {
                demand[rtype] = rcount * (3 + child_modifier * 2);
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
        // Willing to spend demand/consumption*0.5 of all gold on deficits. but only up to full store amount.
        // Since there can be multiple resources, the potential budget is larger than store
        // But that's fine since this is not an distributing function
        // Market economy at work
        for (let [rtype, rcount] of Object.entries(person.market.demand)) {
            let consumption = 0.1;
            if (rtype in PersonUtil.get_consumption(person)) {
                consumption += PersonUtil.get_consumption(person)[rtype];
            }
            let spendVal = rcount/(consumption) * 0.5 * credit_line;
            budget[rtype] = spendVal > credit_line ? credit_line : spendVal;
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

    static provide_childcare(person: Person, simulation) : void {
        // Give resources to children, younger ones gets precedence
        let children = simulation.genealogy.get_children(person).map(c => simulation.people[c.id]).filter(Boolean).reverse();
        let self_consumption = PersonUtil.get_consumption(person);
        person.family_support["SUPPORT"] = {};
        for (let c of children) {
            // Only supported until 18
            if (c.age > 18) {
                continue;
            }
            let consumption = PersonUtil.get_consumption(c);
            c.family_support["RECEIVE"] = {};
            for (let rtype in consumption) {
                let rcount = lang.get_numeric_value(person.store, rtype);
                if (rcount < lang.get_numeric_value(self_consumption, rtype) * 0.8) {
                    continue;
                } else {
                    let available = rcount - lang.get_numeric_value(self_consumption, rtype) * 0.8;
                    let transfer = available > consumption[rtype] ? consumption[rtype] : available;
                    lang.add_value(c.store, rtype, transfer);
                    lang.add_value(person.store, rtype, -transfer);
                    lang.add_value(person.family_support["SUPPORT"], rtype, transfer);
                    lang.add_value(c.family_support["RECEIVE"], rtype, transfer);
                }
            }
        }
    }

    static get_real_consumption(person: Person) : {[rtype: string]: number} {
        if (person.type == "MORT") {
            return {};
        }
        let result: {[rtype: string]: number} = {};
        for (let [rtype, rcount] of Object.entries(PersonUtil.get_consumption(person))) {
            result[rtype] = rcount - lang.get_numeric_value(person.deficit, rtype);
        }
        return result;
    }
}

const FOOD_DRAFT_TYPE = {
    HUNT: "LAND",
    FARM: "LAND",
    FISH: "WATER",
}

const PRODUCTION_TYPE_MAP = {
    HUNT: "HUNT",
    FARM: "FARM",
    FISH: "FISH",
    TRAD: "TRAD",
    WOOD: "WOOD",
    TOOL: "TOOL",
}

const BIRTH_TYPE_MAP = {
    HUNT: "HUNT",
    FARM: "FARM",
    FISH: "FISH",
    TRAD: "HUNT",
    WOOD: "HUNT",
    TOOL: "TOOL",
}

const deficit_complaints_map = {
    "FOOD" : "food",
    "WOOD" : "wood",
    "TOOL" : "tooling",
}
