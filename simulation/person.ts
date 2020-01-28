import { RESOURCE_TYPE } from "./resources";
import * as firstnames from "../assets/data/firstname_f.json";
import * as surnames from "../assets/data/surnames.json";
import { v4 as uuid } from 'uuid';
import { ResourceMap } from "../map/informationMap";
import { Point } from "../map/mapUtil";
import * as lang from "./utilities/langutil";

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
            if (income_type in person.store) {
                person.store[income_type] += income;
            } else {
                person.store[income_type] = income;
            }
        }
    }

    static consume(person: Person): void {
        let consumption = PersonUtil.get_consumption(person);
        let deficit = {};
        for (let [consume_type, consume_count] of Object.entries(consumption)) {
            if (consume_type in person.store) {
                if (consume_count < person.store[consume_type]) {
                    person.store[consume_type] -= consume_count;
                } else {
                    deficit[consume_type] = consume_count - person.store[consume_type];
                    person.store[consume_type] = 0;
                    person.eventlog += `She's ${deficit_complaints_map[consume_type]}. `
                }
            } else {
                deficit[consume_type] = consume_count;
                person.eventlog += `She's ${deficit_complaints_map[consume_type]}. `
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
        return typedef.work_radius;
    }

    static get_work_strength(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        return typedef.work_strength;
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
        return typedef.draft;
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
            person.store[rtype] -= rcost;
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
        let typedef: PersonType = PersonUtil.get_type_def(person);
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
                let demandMultiplier = 1.2 - person.store[rtype]/(rcount*10);
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
                demand[rtype] = rcount * 1.5;
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
}

type PersonType = {
    type: string;
    travel: number;
    home: number;
    work_strength: number;
    work_radius: number;
    draft: { [key: string]: number[] };
    // draft; [RESOURCE_TYPE.FOOD: [radius, strength]];
    consumption: { [key: string]: number };
    change_func: Function;
    replicate_func: Function;
    replicate_cost: { [key: string]: number };
}

const fisher: PersonType = {
    type: "FISH",
    travel: 1,
    home: 0,
    work_strength: 0.3,
    work_radius: 1.5,
    draft: {
        FOOD: [1.5, 1],
        GOLD: [2, 1]
    },
    consumption: {
        FOOD : 0.5,
        WOOD : 0.1,
    },
    change_func: (person, simulation) => {
        let point = ResourceMap.pointToStr(person.x, person.y);
        if (simulation.building_by_location[point]) {
            let building = simulation.building_by_location[point];
            if (person.age >= 15) {
                const get_random_position = () => Math.floor(Math.random() * simulation.geography.length);
                if ("FOOD" in person.deficit) {
                    let randomX = get_random_position();
                    let randomY = get_random_position();
                    let random_point = ResourceMap.pointToStr(randomX, randomY);
                    if (simulation.map_cache[random_point].isCoast) {
                        person.x = randomX;
                        person.y = randomY;
                        person.eventlog += "She has sailed away from her old town to here. ";
                    }
                }
                if (building.type == "TOWN") {
                    if (Math.random() < 0.05) {
                        return "WHAL";
                    }
                    if (Math.random() < 0.02) {
                        return "TRAD";
                    }
                }
                if (building.type == "CITY") {
                    if (Math.random() < 0.1) {
                        return "WHAL";
                    }
                    if (Math.random() < 0.05) {
                        return "TRAD";
                    }
                }
            }
        }
        // This fisher has travelled inland and can no longer fish.
        if (!simulation.map_cache[point].isCoast) {
            if (simulation.building_by_location[point] && simulation.building_by_location[point].type == "FARM") {
                return "FARM";
            }
            return "HUNT";
        }
        // 5% chance to just become hunter because 'Rebellion' while young
        if (Math.random() < 0.03 && person.age < 40) {
            return "HUNT";
        }
        return NO_CHANGE;
    },
    replicate_func: (person) => {
        return (Math.random()+0.25 < person.store[RESOURCE_TYPE.FOOD]/7)
    },
    replicate_cost: {
        FOOD : 2
    }
}

const hunter: PersonType = {
    type: "HUNT",
    travel: 4,
    home: 1,
    work_strength: 0.2,
    work_radius: 1.5,
    draft: {
        FOOD: [1.5, 1],
        GOLD: [2.5, 1]
    },
    consumption: {
        FOOD : 0.5
    },
    change_func: (person, simulation) => {
        let point = ResourceMap.pointToStr(person.x, person.y);
        if (simulation.building_by_location[point]) {
            let building = simulation.building_by_location[point];
            if (person.age > 15) {
                if (building.type == "TOWN" && Math.random() < 0.05) {
                    return "TRAD";
                }
                if (building.type == "CITY" && Math.random() < 0.1) {
                    return "TRAD";
                }
            }
        }
        if (simulation.map_cache[point].geography == 3 && Math.random() < 0.1) {
            return "WOOD";
        }
        if ("FOOD" in person.deficit || person.income["FOOD"] < 0.4) {
            if (simulation.map_cache[point].isCoast && Math.random() < 0.8) {
                return "FISH";
            }
            // not everyone wants to farm even when hungry.
            if (simulation.map_cache[point].geography == 2 && Math.random() < 0.2) {
                return "FARM";
            }
        }
        return NO_CHANGE;
    },
    replicate_func: (person) => {
        return (Math.random()+0.25 < person.store[RESOURCE_TYPE.FOOD]/7)
    },
    replicate_cost: {
        FOOD : 2
    }
}

const farmer: PersonType = {
    type: "FARM",
    travel: 1,
    home: 0,
    work_strength: 1,
    work_radius: 0,
    draft: {
        FOOD: [0, 10],
        GOLD: [1.5, 1]
    },
    consumption: {
        FOOD : 0.4
    },
    change_func: (person, simulation) => {
        // 2% chance to just become hunter because 'Rebellion' while young
        if (Math.random() < 0.02 && person.age < 40) {
            return "HUNT";
        }
        return NO_CHANGE;
    },
    replicate_func: (person) => {
        return (Math.random()+0.25 < person.store[RESOURCE_TYPE.FOOD]/7)
    },
    replicate_cost: {
        FOOD : 1.5
    }
}

const trader: PersonType = {
    type: "TRAD",
    travel: 5,
    home: 0,
    work_strength: 3, // Create money in town
    work_radius: 0,
    draft: {
        GOLD: [0, 15],
    },
    consumption: {
        GOLD : 0.5,
        FOOD : 0.5,
    },
    change_func: (person, simulation) => {
        // 2% chance to just become gatherer because 'Rebellion' while young
        if (Math.random() < 0.02 && person.age < 30) {
            return "HUNT";
        }
        return NO_CHANGE;
    },
    replicate_func: (person) => {
        return (Math.random()+0.25 < person.store[RESOURCE_TYPE.FOOD]/8)
    },
    replicate_cost: {
        FOOD : 2,
    }
}

const whaler: PersonType = {
    type: "WHAL",
    travel: 2,
    home: 0,
    work_strength: 0.15,
    work_radius: 3.3,
    draft: {
        FOOD: [3.3, 0.3],
    },
    consumption: {
        FOOD : 0.6,
        WOOD : 0.3,
    },
    change_func: (person, simulation) => {
        // Whaler is an earned distinction, the birth type is fisher. Once whaler, forever whaler.
        // However, ths guy can sail
        const get_random_position = () => Math.floor(Math.random() * simulation.geography.length);
        if ("FOOD" in person.deficit) {
            let randomX = get_random_position();
            let randomY = get_random_position();
            let random_point = ResourceMap.pointToStr(randomX, randomY);
            if (simulation.map_cache[random_point].isCoast) {
                person.x = randomX;
                person.y = randomY;
                person.eventlog += "She has sailed away from her old town to here. ";
            }
        }
        return NO_CHANGE;
    },
    replicate_func: (person) => {
        return (Math.random()+0.25 < person.store[RESOURCE_TYPE.FOOD]/8)
    },
    replicate_cost: {
        FOOD : 2,
    }
}

const lumber: PersonType = {
    type: "WOOD",
    travel: 1,
    home: 0,
    work_strength: 1,
    work_radius: 0,
    draft: {
        WOOD : [0, 1],
    },
    consumption: {
        FOOD : 0.6,
    },
    change_func: (person, simulation) => {
        // Hungry lumberjacks become hunter
        if ("FOOD" in person.deficit && Math.random() < 0.5) {
            return "HUNT";
        }
        return NO_CHANGE;
    },
    replicate_func: (person) => {
        return (Math.random()+0.25 < person.store[RESOURCE_TYPE.FOOD]/8)
    },
    replicate_cost: {
        FOOD : 2,
    }
}

const TYPE_MAP = {
    "HUNT" : hunter,
    "FARM" : farmer,
    "FISH" : fisher,
    "TRAD" : trader,
    "WHAL" : whaler,
    "WOOD" : lumber,
}

const PRODUCTION_TYPE_MAP = {
    HUNT: "HUNT",
    FARM: "FARM",
    FISH: "FISH",
    TRAD: "TRAD",
    WHAL: "FISH",
    WOOD: "WOOD",
}

const BIRTH_TYPE_MAP = {
    HUNT: "HUNT",
    FARM: "FARM",
    FISH: "FISH",
    TRAD: "TRAD",
    WHAL: "FISH",
    WOOD: "HUNT",
}

const deficit_complaints_map = {
    "FOOD" : "hungry",
    "WOOD" : "needs wood",
}
