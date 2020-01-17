import { RESOURCE_TYPE } from "./resources";
import * as firstnames from "../assets/data/firstname_f.json";
import * as surnames from "../assets/data/surnames.json";
import { v4 as uuid } from 'uuid';
import { ResourceMap } from "../map/informationMap";
import { Point } from "../map/mapUtil";

const MORTALITY = "MORT";
const NO_CHANGE = "STAY";

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
}

export class PersonUtil {

    static move_person(person: Person, mapCache): void {
        let north = ResourceMap.pointToStr(person.x, person.y + 1);
        let south = ResourceMap.pointToStr(person.x, person.y - 1);
        let west = ResourceMap.pointToStr(person.x + 1, person.y);
        let east = ResourceMap.pointToStr(person.x - 1, person.y);
        let decision: string = [north, east, west, south][Math.floor(Math.random()*4)];
        if (decision in mapCache && mapCache[decision].geography > 0) {
            let newloc: Point = JSON.parse(decision);
            person.x = newloc.x;
            person.y = newloc.y;
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
                }
            } else {
                deficit[consume_type] = consume_count;
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
            pstatus = MORTALITY;
        }
        // Ageing
        if (Math.random() * 60 < person.age - 60) {
            pstatus = MORTALITY;
        }
        if (pstatus == NO_CHANGE) {
            return;
        }
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
            type: person.type,
            name: PersonUtil.get_random_name(false) + " " + surname,
            unique_id: uuid(),
            eventlog: "",
            age: 0,
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
        FOOD: [1.5, 1]
    },
    consumption: {
        FOOD : 0.5
    },
    change_func: (person, map_cache) => {
        let point = ResourceMap.pointToStr(person.x, person.y);
        // This fisher has travelled inland and can no longer fish.
        if (!map_cache[point].isCoast) {
            return "HUNT";
        }
        // 5% chance to just become hunter because 'Rebellion' while young
        if (Math.random() < 0.05 && person.age < 40) {
            return "HUNT";
        }
        return NO_CHANGE;
    },
    replicate_func: (person) => {
        return (Math.random()+0.25 < person.store[RESOURCE_TYPE.FOOD]/6)
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
        FOOD: [1.5, 1]
    },
    consumption: {
        FOOD : 0.5
    },
    change_func: (person, map_cache) => {
        if ("FOOD" in person.deficit) {
            let point = ResourceMap.pointToStr(person.x, person.y);
            if (map_cache[point].isCoast) {
                return "FISH";
            }
            // not everyone wants to farm even when hungry.
            if (map_cache[point].geography == 2 && Math.random() < 0.2) {
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
        FOOD: [0, 8]
    },
    consumption: {
        FOOD : 0.4
    },
    change_func: (person, map_cache) => {
        // 2% chance to just become hunter because 'Rebellion' while young
        if (Math.random() < 0.02 && person.age < 40) {
            return "HUNT";
        }
        return NO_CHANGE;
    },
    replicate_func: (person) => {
        return (Math.random()+0.25 < person.store[RESOURCE_TYPE.FOOD]/5)
    },
    replicate_cost: {
        FOOD : 1.5
    }
}

export const TYPE_MAP = {
    "HUNT" : hunter,
    "FARM" : farmer,
    "FISH" : fisher,
}
