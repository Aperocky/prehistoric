import { TerrainMap, Point } from "../map/mapUtil";
import { ResourceMap, createMapCache, LocalInformation } from "../map/informationMap";
import { Person, PersonUtil } from "./people/person";
import { Genealogy } from "./people/genealogy";
import { Building, BuildingUtil } from "./buildings";
import { MarketConditions, get_supply_and_demand, do_business } from "./market";
import { v4 as uuid } from 'uuid';
import * as SimUtil from "./utilities/simutil";

export const FIXED_MAP_SIZE = 20;
const INITIAL_BATCH_SIZE = 20;

export class Simulation {
    // General
    geography : number[][];
    map_cache : { [location: string] : LocalInformation };
    land_tiles : Array<string>;
    people : { [key: string] : Person };
    genealogy: Genealogy;

    // Turn specifics
    year : number;
    effort_map : ResourceMap;
    production_map : ResourceMap;
    draft_map : ResourceMap;
    income_by_people : { [key: string] : { [key: string] : number }};
    people_by_location : { [key: string] : Person[] };
    building_by_location : { [key: string] : Building };
    market_conditions: MarketConditions;

    generate() {
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
        this.people_by_location = {};
        this.building_by_location = {};
        this.market_conditions = {
            supply: {},
            demand: {},
            liquidity: {},
            pricing: {},
            activity: {},
        } // Dummy
        this.genealogy = new Genealogy(Object.values(this.people));
    }

    // State update function
    next_round() {
        for (let person of Object.values(this.people)) {
            if (person.type == "MORT") {
                // RIP
                this.inherit_from(person);
                this.genealogy.funeral(person, this.year);
                delete this.people[person.unique_id];
            }
        }
        if (this.year % 10 === 0) {
            this.genealogy.clear_forgotten(this);
        }
        // Move first, so same people in same place create same contributions/ income
        this.year += 1;
        this.genealogy.turn_num = this.year;
        this.move_people();
        // Map logic (production, distribution on map scale)
        this.effort_map = SimUtil.create_effort_map(Object.values(this.people), FIXED_MAP_SIZE);
        this.production_map = SimUtil.create_production_map(this.effort_map, this.map_cache, this.building_by_location, FIXED_MAP_SIZE);
        this.draft_map = SimUtil.create_draft_map(Object.values(this.people), this, FIXED_MAP_SIZE);
        // The means of production
        this.income_by_people = this.harvest();
        this.distribute();
        this.market_conditions = get_supply_and_demand(Object.values(this.people), this);
        do_business(Object.values(this.people), this.market_conditions);
        // Life
        this.commence_life();
        this.people_by_location = this.get_people_for_show();
        // Building logic
        this.add_and_run_buildings();
    }
    getNewTerrainMap() : number[][] {
        let terrainMap;
        while (true) {
            terrainMap = new TerrainMap(FIXED_MAP_SIZE);
            let land: Array<string> = this.getLand(terrainMap.map);
            if (land.length >= 30) {
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
                store: {FOOD: 1, GOLD: 1},
                type: "HUNT",
                name: PersonUtil.get_random_full_name(),
                unique_id: uuid(),
                eventlog: "",
                age: Math.floor(Math.random()*20+10),
                market: PersonUtil.init_market_pack(),
                family_support: {},
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

    add_and_run_buildings() {
        // Adding buildings.
        for (let [pointstr, people] of Object.entries(this.people_by_location)) {
            if (pointstr in this.building_by_location) {
                continue;
            }
            let building = BuildingUtil.create_building(pointstr, people);
            if (building) {
                this.building_by_location[pointstr] = building;
            }
        }
        // Run all existing buildings
        for (let [pointstr, building] of Object.entries(this.building_by_location)) {
            let people: Person[] = [];
            if (pointstr in this.people_by_location) {
                people = this.people_by_location[pointstr];
            }
            let bstate = BuildingUtil.run_maintenance(building, people);
            // Building has dilapidated, remove
            if (bstate == "NONE") {
                delete this.building_by_location[pointstr];
                continue;
            }
            // Change building type
            if (!(bstate == building.type)) {
                building.type = bstate;
                building.maintenance = BuildingUtil.get_start_maintenance(building);
            }
        }
    }

    move_people() {
        for (let person of Object.values(this.people)) {
            // Refresh event log
            person.eventlog = "";
            if ("FOOD" in person.deficit) {
                for (let i = 0; i < PersonUtil.get_travel(person); i++) {
                    PersonUtil.move_person(person, this);
                }
            } else {
                for (let i = 0; i < PersonUtil.get_home(person); i++) {
                    PersonUtil.move_person(person, this);
                }
            }
        }
    }

    // SOYUZ !!!
    distribute() {
        // Clear all previous income/family support by people
        for (let person of Object.values(this.people)) {
            person.income = {};
            person.family_support = {};
        }
        // Current income
        for (let [person_id, income] of Object.entries(this.income_by_people)) {
            this.people[person_id].income = income;
        }
        // Add income to people before trading begins.
        for (let person of Object.values(this.people)) {
            // Add private production at personal level
            PersonUtil.private_enteprise(person);
            PersonUtil.add_income_to_store(person);
            PersonUtil.provide_childcare(person, this);
        }
    }

    commence_life() {
        for (let person of Object.values(this.people)) {
            PersonUtil.run_change_func(person, this);
            PersonUtil.consume(person);
            person.age += 1;
            if (!(person.type == "MORT")) {
                let new_person = PersonUtil.run_replicate_func(person, this.genealogy);
                if (new_person) {
                    this.people[new_person.unique_id] = new_person;
                    this.genealogy.birth(new_person, person, this.year);
                    if (person.type == "MORT") {
                        person.eventlog += `She died giving birth to ${new_person.name}`;
                    } else {
                        person.eventlog += `She gave birth to ${new_person.name}`;
                    }
                }
            }
        }
    }

    // ---------------------------------------------------------------------------
    // Above are simulation core functions, below are utility functions
    // ---------------------------------------------------------------------------

    inherit_from(person: Person) : void {
        let pointstr = ResourceMap.pointToStr(person.x, person.y);
        let people_in_location = this.people_by_location[pointstr];
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

    get_buildings() : { [key: string]: number } {
        let buildings: { [key: string]: number } = {};
        for (let building of Object.values(this.building_by_location)) {
            if (building.type in buildings) {
                buildings[building.type] += 1;
            } else {
                buildings[building.type] = 1;
            }
        }
        return buildings;
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
