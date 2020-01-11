import { TerrainMap, Point } from "../map/mapUtil";
import { ResourceMap } from "../map/informationMap";
import { Person, TYPE_MAP } from "./person";
import { v4 as uuid } from 'uuid';
import * as SimUtil from "./simutil";

export const FIXED_MAP_SIZE = 20;
const INITIAL_BATCH_SIZE = 5;

export class Simulation {
    // General
    geography : number[][];
    land_tiles : Array<string>;
    people : { [key: string] : Person };

    // Turn specifics
    effort_map : ResourceMap;
    production_map : ResourceMap;
    draft_map : ResourceMap;
    income_by_people : { [key: string] : { [key: string] : number }};

    generate() {
        console.log("Refreshing map");
        this.people = {};
        this.geography = this.getNewTerrainMap();
        this.place_people();
    }

    next_round() {
        console.log("Going to next round");
        this.effort_map = SimUtil.create_effort_map(Object.values(this.people), FIXED_MAP_SIZE);
        this.production_map = SimUtil.create_production_map(this.effort_map, this.geography);
        this.draft_map = SimUtil.create_draft_map(Object.values(this.people), this.production_map, FIXED_MAP_SIZE);
        this.income_by_people = this.harvest();
        this.distribute();
    }

    getNewTerrainMap() : number[][] {
        let terrainMap;
        while (true) {
            terrainMap = new TerrainMap(FIXED_MAP_SIZE);
            let land: Array<string> = this.getLand(terrainMap.map);
            if (land.length >= 100) {
                this.land_tiles = land;
                break;
            }
        }
        return terrainMap.map;
    }

    getLand(map: number[][]) : Array<string> {
        let land: Array<string> = [];
        for (let i = 0; i < FIXED_MAP_SIZE; i++) {
            for (let j = 0; j < FIXED_MAP_SIZE; j++) {
                if (map[i][j] > 0) {
                    land.push(ResourceMap.pointToStr(i, j));
                }
            }
        }
        return land;
    }

    place_people() : void {;
        // Randomly select location to place people
        let promised_land: Array<string> = [];
        for (let i = 0; i < INITIAL_BATCH_SIZE; i++) {
            let location = this.land_tiles[Math.floor(Math.random() * this.land_tiles.length)];
            promised_land.push(location);
        }
        for (let location of promised_land) {
            let point: Point = JSON.parse(location);
            let person: Person = {
                x: point.x,
                y: point.y,
                income: {},
                store: {},
                type: "HUNT",
                name: uuid(),
                unique_id: uuid(),
            }
            this.people[person.unique_id] = person;
        }
    }

    get_people_for_show() : { [key: string] : Array<Person> } {
        let result = {};
        for (let person of Object.values(this.people)) {
            let pointstr = ResourceMap.pointToStr(person.x, person.y);
            if (pointstr in result) {
                result[pointstr].push(person);
            } else {
                result[pointstr] = [person];
            }
        }
        return result;
    }

    harvest() : { [key: string] : { [key: string] : number }} {
        let harvest_result = {}
        for (let [location, produce] of Object.entries(this.production_map.resourceMap)) {
            if (location in this.draft_map.resourceMap) {
                let draft_information = this.draft_map.resourceMap[location].resource;
                let produce_type = Object.keys(this.production_map.resourceMap[location].resource)[0];
                let produce_count = Object.values(this.production_map.resourceMap[location].resource)[0];
                // Total draft strength in this location
                let total_draft_strength = Object.values(draft_information).reduce((a,b) => a+b, 0); 
                for (let [person_id, draft_strength] of Object.entries(draft_information)) {
                    let receive_count = draft_strength / total_draft_strength * produce_count;
                    if (person_id in harvest_result) {
                        if (produce_type in harvest_result[person_id]) {
                            harvest_result[person_id][produce_type] += receive_count;
                        } else {
                            harvest_result[person_id][produce_type] = receive_count;
                        }
                    } else {
                        let income_obj: { [key: string] : number } = {}
                        income_obj[produce_type] = receive_count;
                        harvest_result[person_id] = income_obj;
                    }
                }
            }
        }
        return harvest_result;
    }

    // SOYUZ !!!
    distribute() {
        for (let [person_id, income] of Object.entries(this.income_by_people)) {
            this.people[person_id].income = income;
        }
    }
}

