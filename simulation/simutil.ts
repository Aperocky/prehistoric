import { TerrainMap, Point } from "../map/mapUtil";
import { ResourceMap } from "../map/informationMap";
import { Person, PersonUtil } from "./person";
import { PRODUCE_MAP, PRODUCE_TYPE } from "./resources";

// Efforts at production
export function create_effort_map(people: Person[], boundary: number): ResourceMap {
    let effort_map = new ResourceMap(boundary);
    for (let person of people) {
        let work_radius = PersonUtil.get_work_radius(person);
        let work_strength = PersonUtil.get_work_strength(person);
        let person_type = person.type;
        let in_work_positions = ResourceMap.get_radius_position(person.x, person.y, work_radius);
        for (let position of in_work_positions) {
            effort_map.place_resource(position.x, position.y, person_type, work_strength);
        }
    }
    return effort_map;
}

// Actual production by tile
// The implementation of this function guarantees the production out of one tile can only be of one type.
export function create_production_map(effort_map: ResourceMap, geography: number[][]): ResourceMap {
    let boundary: number = geography.length;
    let production_map = new ResourceMap(boundary);
    // Use the strongest production type. i.e. you can't hunt and farm in same place.
    for (let [pointstr, effort] of Object.entries(effort_map.resourceMap)) {
        let point: Point = JSON.parse(pointstr);
        let point_geography = geography[point.x][point.y];
        // Building coming in subsequent feature.
        let final_production_type: string;
        let final_production_count: number = 0;
        for (let [production_type, work_strength] of Object.entries(effort)) {
            let production = PRODUCE_MAP[production_type](work_strength, point_geography, {});
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
