import { TerrainMap, Point } from "../map/mapUtil";
import { ResourceMap } from "../map/informationMap";
import { Person, TYPE_MAP } from "./person";
import * as Resources from "./resources";
import { v4 as uuid } from 'uuid';

export const FIXED_MAP_SIZE = 20;
const INITIAL_BATCH_SIZE = 5;

export class Simulation {
    geography : number[][];
    land_tiles : Array<string>;
    people : { [key: string] : Person };

    generate() {
        console.log("Refreshing map");
        this.people = {};
        this.geography = this.getNewTerrainMap();
        this.place_people();
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
            }
            this.people[person.name] = person;
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
}
