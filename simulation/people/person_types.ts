import { RESOURCE_TYPE } from "../resources";
import { ResourceMap } from "../../map/informationMap";

const NO_CHANGE = "STAY";

export type PersonType = {
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
}

const fisher: PersonType = {
    type: "FISH",
    travel: 1,
    home: 0,
    work_strength: 0.3,
    work_radius: 1,
    draft: {
        FOOD: [1, 1],
        GOLD: [1.5, 1]
    },
    consumption: {
        FOOD : 0.5,
        WOOD : 0.1,
    },
    change_func: (person, simulation) => {
        let point = ResourceMap.pointToStr(person.x, person.y);
        if (simulation.building_by_location[point]) {
            let building = simulation.building_by_location[point];
            if (person.age >= 13) {
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
                    if (Math.random() < 0.1) {
                        return "WHAL";
                    }
                    if (Math.random() < 0.02) {
                        return "TRAD";
                    }
                    if (Math.random() < 0.05) {
                        return "TOOL";
                    }
                }
                if (building.type == "CITY") {
                    if (Math.random() < 0.05) {
                        return "WHAL";
                    }
                    if (Math.random() < 0.1) {
                        return "TRAD";
                    }
                    if (Math.random() < 0.1) {
                        return "TOOL";
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
            if (person.age >= 15) {
                if (building.type == "TOWN") {
                    if (Math.random() < 0.05) {
                        return "TRAD";
                    }
                    if (Math.random() < 0.1) {
                        return "TOOL";
                    }
                }
                if (building.type == "CITY") {
                    if (Math.random() < 0.1) {
                        return "TRAD";
                    }
                    if (Math.random() < 0.1) {
                        return "TOOL";
                    }
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
        FOOD : 0.4,
        TOOL : 0.1,
    },
    change_func: (person, simulation) => {
        // 5% chance to become hunter if not getting enough food
        if (Math.random() < 0.05 && person.income["FOOD"] < 0.4) {
            return "HUNT";
        }
        let point = ResourceMap.pointToStr(person.x, person.y);
        if (simulation.building_by_location[point]) {
            let building = simulation.building_by_location[point];
            if (building.type == "TOWN" && Math.random() < 0.2) {
                return "TOOL";
            }
            if (building.type == "CITY" && Math.random() < 0.4) {
                return "TOOL";
            }
        }
        return NO_CHANGE;
    },
    replicate_func: (person) => {
        return (Math.random()+0.25 < person.store[RESOURCE_TYPE.FOOD]/7)
    },
}

const trader: PersonType = {
    type: "TRAD",
    travel: 5,
    home: 0,
    work_strength: 3, // Create money in town
    work_radius: 0,
    draft: {
        GOLD: [0, 3],
    },
    consumption: {
        FOOD : 0.5,
        TOOL : 0.1,
    },
    change_func: (person, simulation) => {
        // If hungry, become gatherer instead.
        if ("FOOD" in person.deficit) {
            if (Math.random() < 0.3) {
                return "HUNT";
            }
            if (Math.random() < 0.3) {
                return "TOOL";
            }
        }
        return NO_CHANGE;
    },
    replicate_func: (person) => {
        return (Math.random()+0.25 < person.store[RESOURCE_TYPE.FOOD]/7)
    },
}

const whaler: PersonType = {
    type: "WHAL",
    travel: 2,
    home: 0,
    work_strength: 0.15,
    work_radius: 3,
    draft: {
        FOOD: [3, 0.3],
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
        return (Math.random()+0.25 < person.store[RESOURCE_TYPE.FOOD]/7)
    },
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
        TOOL : 0.2,
    },
    change_func: (person, simulation) => {
        // Hungry lumberjacks become hunter
        if ("FOOD" in person.deficit && Math.random() < 0.5) {
            return "HUNT";
        }
        return NO_CHANGE;
    },
    replicate_func: (person) => {
        return (Math.random()+0.25 < person.store[RESOURCE_TYPE.FOOD]/7)
    },
}

// Special about tooler: this type runs own business and does not participate
// In production and draft maps, instead, personal produce will be traded.
const tooler: PersonType = {
    type: "TOOL",
    travel: 3,
    home: 0,
    work_strength: 1,
    work_radius: 0,
    draft: {
        GOLD : [0, 1],
    },
    consumption: {
        FOOD : 0.5,
        WOOD : 0.2,
    },
    change_func: (person, simulation) => {
        // Hungry craftman become hunter
        if ("FOOD" in person.deficit && Math.random() < 0.5) {
            return "HUNT";
        }
        return NO_CHANGE;
    },
    replicate_func: (person) => {
        return (Math.random()+0.25 < person.store[RESOURCE_TYPE.FOOD]/7)
    },
}

export const TYPE_MAP = {
    "HUNT" : hunter,
    "FARM" : farmer,
    "FISH" : fisher,
    "TRAD" : trader,
    "WHAL" : whaler,
    "WOOD" : lumber,
    "TOOL" : tooler,
}
