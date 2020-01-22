import { TerrainMap, Point } from "../map/mapUtil";
import { ResourceMap } from "../map/informationMap";
import { Person, PersonUtil } from "./person";
import { Building } from "./buildings";
import { PRODUCE_MAP, PRODUCE_TYPE } from "./resources";

// Efforts at production
export function create_effort_map(people: Person[], boundary: number): ResourceMap {
    let effort_map = new ResourceMap(boundary);
    for (let person of people) {
        let work_radius = PersonUtil.get_work_radius(person);
        let work_strength = PersonUtil.get_work_strength(person);
        if (work_strength == 0) {
            // For people who don't produce resource. (i.e. bandits, taxman, trader, police etc.)
            continue;
        }
        let production_type = PersonUtil.get_production_type(person);
        let in_work_positions = ResourceMap.get_radius_position(person.x, person.y, work_radius);
        for (let position of in_work_positions) {
            effort_map.place_resource(position.x, position.y, production_type, work_strength);
        }
    }
    return effort_map;
}

// Actual production by tile
// The implementation of this function guarantees the production out of one tile can only be of one type.
export function create_production_map(effort_map: ResourceMap, map_cache, building_by_location, boundary: number): ResourceMap {
    let production_map = new ResourceMap(boundary);
    // Use the strongest production type. i.e. you can't hunt and farm in same place.
    for (let [pointstr, effort] of Object.entries(effort_map.resourceMap)) {
        let point_geography = map_cache[pointstr].geography;
        // Building coming in subsequent feature.
        let final_production_type: string;
        let final_production_count: number = 0;
        let building: Building | null = null;
        if (pointstr in building_by_location) {
            building = building_by_location[pointstr];
        }
        for (let [production_type, work_strength] of Object.entries(effort)) {
            let production = PRODUCE_MAP[production_type](work_strength, point_geography, building);
            if (production > final_production_count) {
                final_production_type = production_type;
                final_production_count = production;
            }
        }
        if (!final_production_type) {
            continue;
        }
        let produced_type = PRODUCE_TYPE[final_production_type];
        production_map.place_resource_with_position(pointstr, produced_type, final_production_count);
    }
    return production_map;
}

function get_single_draft_type(draft_map: ResourceMap, production_map: ResourceMap, person: Person, draft_type: string, draft_stat: number[]): void {
    let draftpoints: Point[] = ResourceMap.get_radius_position(person.x, person.y, draft_stat[0]);
    for (let point of draftpoints) {
        let pointstr = ResourceMap.pointToStr(point.x, point.y);
        if (pointstr in production_map.resourceMap) {
            // Guaranteed to have only one type in production_map
            let production_type_in_tile = Object.keys(production_map.resourceMap[pointstr])[0];
            if (production_type_in_tile == draft_type) {
                draft_map.place_resource_with_position(pointstr, person.unique_id, draft_stat[1]);
            }
        }
    }
}

// Complexity Analysis:
// person: O(n)
// draft_info: O(1)
// point: O(r^2)
// r: O(1)
export function create_draft_map(people: Person[], production_map: ResourceMap, boundary: number): ResourceMap {
    let draft_map = new ResourceMap(boundary);
    for (let person of people) {
        let draft_info: { [key: string]: number[] } = PersonUtil.get_draft(person);
        for (let [draft_type, draft_stat] of Object.entries(draft_info)) {
            get_single_draft_type(draft_map, production_map, person, draft_type, draft_stat);
        }
    }
    return draft_map;
}

export type StatisticsReport = {
    population: number;
    average_age: number;
    composition: { [ptype: string]: number };
    total_income: { [resource: string]: number };
    total_consumption: { [resource: string]: number };
    total_wealth: { [resource: string]: number };
}

function get_composition(people: Person[]) : { [ptype: string]: number } {
    let composition = {};
    for (let person of people) {
        let ptype = person.type;
        if (ptype in composition) {
            composition[ptype] += 1;
        } else {
            composition[ptype] = 1;
        }
    }
    return composition;
}

function get_wealth(people: Person[]) : { [resource: string]: number } {
    let wealth: { [key: string]: number } = {};
    for (let person of people) {
        let storage = person.store;
        for (let [rtype, store] of Object.entries(storage)) {
            if (rtype in wealth) {
                wealth[rtype] += store;
            } else {
                wealth[rtype] = store;
            }
        }
    }
    return wealth;
}

function get_gdp(people: Person[]) : { [key: string]: number } {
    let gdp: { [key: string]: number } = {};
    for (let person of people) {
        for (let [rtype, inc] of Object.entries(person.income)) {
            if (rtype in gdp) {
                gdp[rtype] += inc;
            } else {
                gdp[rtype] = inc;
            }
        }
    }
    return gdp;
}

function get_consumption(people: Person[]) : { [key: string]: number } {
    let consumption: { [key: string]: number } = {};
    for (let person of people) {
        if (person.type == "MORT") {
            continue;
        }
        for (let [rtype, cons] of Object.entries(PersonUtil.get_consumption(person))) {
            if (rtype in consumption) {
                consumption[rtype] += cons;
            } else {
                consumption[rtype] = cons;
            }
            if (rtype in person.deficit) {
                consumption[rtype] -= person.deficit[rtype];
            }
        }
    }
    return consumption;
}

// To replace utility functions from simulation.ts
export class BureauOfStatistics {

    static generate_statistic_report(people: Person[]) : StatisticsReport {
        let population = people.length;
        let average_age = people.reduce((sum, p) => p.age + sum, 0) / population;
        let composition = get_composition(people);
        let total_income = get_gdp(people);
        let total_wealth = get_wealth(people);
        let total_consumption = get_consumption(people);
        return {
            population: population,
            average_age: average_age,
            composition: composition,
            total_income: total_income,
            total_consumption: total_consumption,
            total_wealth: total_wealth,
        }
    }
}
