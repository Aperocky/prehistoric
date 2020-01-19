import { ResourceMap } from "../map/informationMap";
import { Point } from "../map/mapUtil";
import { Person } from "./person";

const NIL = "NONE";

export type Building = {
    type: string;
    age: number;
    maintenance: number; // Number that will deteriorate building when too low.
}

export type BuildingType = {
    type: string;
    maintenance_cost: number;
    run_maintenance: Function;
    create_func: Function;
    low_thresh: number;
    start_point: number;
    high_thresh: number;
    upgrade: string; // Put itself if no plan to add upgrade building yet
    downgrade: string;
}

export class BuildingUtil {

    static run_maintenance(building: Building, people: Person[]): string {
        building.age += 1
        let type_def: BuildingType = BUILDING_MAP[building.type];
        let maintenance_point = type_def.run_maintenance(building, people);
        building.maintenance += maintenance_point;
        if (building.maintenance < type_def.low_thresh) {
            return type_def.downgrade;
        }
        if (building.maintenance > type_def.high_thresh) {
            building.maintenance = type_def.high_thresh;
            return type_def.upgrade;
        }
        return type_def.type;
    }

    static get_start_maintenance(building): number {
        let type_def: BuildingType = BUILDING_MAP[building.type];
        return type_def.start_point;
    }

    static create_building(pointstr: string, people: Person[]): Building | null {
        if (farm.create_func(people)) {
            let point: Point = JSON.parse(pointstr);
            return {
                type: "FARM",
                age: 0,
                maintenance: farm.start_point,
            }
        }
        if (town.create_func(people)) {
            let point: Point = JSON.parse(pointstr);
            return {
                type: "TOWN",
                age: 0,
                maintenance: town.start_point,
            }
        }
        return null;
    }
}

const farm: BuildingType = {
    type: "FARM",
    maintenance_cost: 2,
    run_maintenance: (building: Building, people: Person[]): number => {
        let farmer_count = people.filter(p => p.type == "FARM").length;
        let other_count = people.length - farmer_count;
        let new_maintenance = farmer_count - other_count;
        return new_maintenance;
    },
    low_thresh: 30,
    start_point: 50,
    high_thresh: 200,
    upgrade: "FARM",
    downgrade: NIL,
    create_func: (people: Person[]): boolean => {
        let farmer_count = people.filter(p => p.type == "FARM").length;
        if (farmer_count > 4) {
            return true;
        }
        return false;
    }
}

const town: BuildingType = {
    type: "TOWN",
    maintenance_cost: 8,
    run_maintenance: (building: Building, people: Person[]): number => {
        let new_maintenance = people.length * people.length / 8;
        return new_maintenance;
    },
    low_thresh: 30,
    start_point: 100,
    high_thresh: 400,
    upgrade: "TOWN",
    downgrade: NIL,
    create_func: (people: Person[]): boolean => {
        if (people.length > 10) {
            return true;
        }
        return false;
    }
}

const BUILDING_MAP = {
    "FARM": farm,
    "TOWN": town,
}
