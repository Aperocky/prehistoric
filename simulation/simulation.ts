import { TerrainMap, Point } from "../map/mapUtil";
import { ResourceMap, createMapCache } from "../map/informationMap";
import { Person, TYPE_MAP, PersonUtil } from "./person";
import { v4 as uuid } from 'uuid';
import * as SimUtil from "./simutil";

export const FIXED_MAP_SIZE = 20;
const INITIAL_BATCH_SIZE = 20;

export class Simulation {
    // General
    geography : number[][];
    map_cache : { [location: string] : object };
    land_tiles : Array<string>;
    people : { [key: string] : Person };
    log_queue : string[];

    // Turn specifics
    year : number;
    effort_map : ResourceMap;
    production_map : ResourceMap;
    draft_map : ResourceMap;
    income_by_people : { [key: string] : { [key: string] : number }};

    generate() {
        console.log("Refreshing map");
        this.people = {};
        this.geography = this.getNewTerrainMap();
        this.map_cache = createMapCache(this.geography);
        this.year = 0;
        this.place_people();
        // Teardown of stateful variables
        this.effort_map = new ResourceMap(FIXED_MAP_SIZE);
        this.production_map = new ResourceMap(FIXED_MAP_SIZE);
        this.draft_map = new ResourceMap(FIXED_MAP_SIZE);
        this.income_by_people = {};
        this.log_queue = [];
    }

    next_round() {
        console.log("Going to next round");
        let people_by_location = this.get_people_for_show();
        for (let person of Object.values(this.people)) {
            if (person.type == "MORT") {
                // RIP
                this.inherit_from(person, people_by_location);
                console.log(person.name + " has left the world, RIP");
                this.log_to_queue(person.name + " has left the world, RIP");
                delete this.people[person.unique_id];
            }
        }
        // Move first, so same people in same place create same contributions/ income
        this.year += 1;
        this.move_people();
        this.effort_map = SimUtil.create_effort_map(Object.values(this.people), FIXED_MAP_SIZE);
        this.production_map = SimUtil.create_production_map(this.effort_map, this.geography);
        this.draft_map = SimUtil.create_draft_map(Object.values(this.people), this.production_map, FIXED_MAP_SIZE);
        this.income_by_people = this.harvest();
        this.distribute();
        this.commence_life();
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
                deficit: {},
                store: {FOOD: 1},
                type: "HUNT",
                name: PersonUtil.get_random_full_name(),
                unique_id: uuid(),
                eventlog: "",
                age: 10,
            }
            this.people[person.unique_id] = person;
        }
    }

    harvest() : { [key: string] : { [key: string] : number }} {
        let harvest_result = {}
        for (let [location, produce] of Object.entries(this.production_map.resourceMap)) {
            if (location in this.draft_map.resourceMap) {
                let draft_information = this.draft_map.resourceMap[location];
                let produce_type = Object.keys(this.production_map.resourceMap[location])[0];
                let produce_count = Object.values(this.production_map.resourceMap[location])[0];
                // Total draft strength in this location
                let total_draft_strength = Object.values(draft_information).reduce((a,b) => a+b, 0);
                for (let [person_id, draft_strength] of Object.entries(draft_information)) {
                    let receive_count = draft_strength * produce_count / total_draft_strength;
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

    move_people() {
        for (let person of Object.values(this.people)) {
            if (Object.keys(person.deficit).length > 0) {
                for (let i = 0; i < PersonUtil.get_travel(person); i++) {
                    PersonUtil.move_person(person, this.map_cache);
                }
            } else {
                for (let i = 0; i < PersonUtil.get_home(person); i++) {
                    PersonUtil.move_person(person, this.map_cache);
                }
            }
        }
    }

    // SOYUZ !!!
    distribute() {
        // Clear all previous income by people
        for (let person of Object.values(this.people)) {
            person.income = {};
        }
        // Current income
        for (let [person_id, income] of Object.entries(this.income_by_people)) {
            this.people[person_id].income = income;
        }
    }

    commence_life() {
        console.log("people count: " + Object.values(this.people).length);
        for (let person of Object.values(this.people)) {
            // Movements!
            person.age += 1;
            PersonUtil.add_income_to_store(person);
            PersonUtil.consume(person);
            // Life!
            PersonUtil.run_change_func(person, this.map_cache);
            if (!(person.type == "MORT")) {
                let new_person = PersonUtil.run_replicate_func(person);
                if (new_person) {
                    this.log_to_queue(person.name + " is born");
                    this.people[new_person.unique_id] = new_person;
                }
            }
        }
    }

    // ---------------------------------------------------------------------------
    // Above are simulation core functions, below are utility functions
    // ---------------------------------------------------------------------------

    log_to_queue(log: string) : void {
        if (this.log_queue.length > 100) {
            this.log_queue.shift();
        }
        this.log_queue.push((4500-this.year) + " BC: " + log);
    }

    inherit_from(person: Person, people_by_location) : void {
        let pointstr = ResourceMap.pointToStr(person.x, person.y);
        let people_in_location = people_by_location[pointstr];
        if (people_in_location.length > 1) {
            let benecount = people_in_location.length - 1
            for (let [rtype, rcount] of Object.entries(person.store)) {
                for (let benefactor of people_in_location) {
                    if (benefactor == person) {
                        continue;
                    }
                    if (rtype in benefactor.store) {
                        benefactor.store[rtype] += rcount / benecount;
                    } else {
                        benefactor.store[rtype] = rcount / benecount;
                    }
                }
            }
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

    get_gdp() : { [key: string]: number } {
        let gdp: { [key: string]: number } = {};
        for (let income of Object.values(this.income_by_people)) {
            for (let [rtype, inc] of Object.entries(income)) {
                if (rtype in gdp) {
                    gdp[rtype] += inc;
                } else {
                    gdp[rtype] = inc;
                }
            }
        }
        return gdp;
    }

    get_wealth() : { [key: string]: number } {
        let wealth: { [key: string]: number } = {};
        for (let person of Object.values(this.people)) {
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

    get_composition() {
        let composition = {};
        for (let person of Object.values(this.people)) {
            let ptype = person.type;
            if (ptype in composition) {
                composition[ptype] += 1;
            } else {
                composition[ptype] = 1;
            }
        }
        return composition;
    }

    get_location_info(pointstr: string) {
        let location_info = {};
        if (pointstr in this.effort_map.resourceMap) {
            let effort_info = this.effort_map.resourceMap[pointstr];
            location_info["potential_effort"] = effort_info;
        }
        if (pointstr in this.production_map.resourceMap) {
            let produce_info = this.production_map.resourceMap[pointstr];
            let produce_type = Object.keys(produce_info)[0];
            let produce_count = produce_info[produce_type];
            location_info["resource"] = produce_type;
            location_info["count"] = produce_count;
        }
        if (pointstr in this.draft_map.resourceMap) {
            // shallow copy works as draft_info is single layer.
            let draft_info = Object.assign({}, this.draft_map.resourceMap[pointstr]);
            location_info["draft"] = draft_info
        }
        return location_info;
    }
}

