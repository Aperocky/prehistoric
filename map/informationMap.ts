import { Point } from "./mapUtil";

export type LocalInformation = {
    geography: number;
    isCoast: boolean;
}

export class ResourceMap {
    boundary: number; // Assume square
    resourceMap : { [key: string] : { [key: string]: number }};
    static radix_memory_cache: { [key: string] : Array<Point> } = {};

    constructor(boundary: number) {
        this.resourceMap = {};
        this.boundary = boundary;
    }

    static pointToStr(x: number, y: number) : string {
        let point: Point = {x: x, y: y};
        return JSON.stringify(point);
    }

    static get_radius_position(x: number, y: number, radius: number) : Point[] {
        // Sanitize input, radius to be put in increment of 0.1
        radius = Math.floor(radius * 10)/10;
        let zero_based_result: Point[] = [];
        let fullrad = Math.floor(radius);
        if (radius.toString() in ResourceMap.radix_memory_cache) {
            zero_based_result = ResourceMap.radix_memory_cache[radius.toString()]
        } else {
            console.log(`Adding ${radius} to radius cache`);
            for (let i = -fullrad; i <= fullrad; i++) {
                for (let j = -fullrad; j <= fullrad; j++) {
                    if (i * i + j * j <= radius * radius) {
                        zero_based_result.push({x: i, y: j});
                    }
                }
            }
            ResourceMap.radix_memory_cache[radius.toString()] = zero_based_result;
        }
        let result: Point[] = [];
        for (let point of zero_based_result) {
            let mod_point = {
                x: point.x + x,
                y: point.y + y
            }
            result.push(mod_point);
        }
        return result;
    }

    place_resource_with_position(pointstr: string, resourceType: string, resourceCount: number): void {
        if (pointstr in this.resourceMap) {
            let resourceInformation = this.resourceMap[pointstr];
            if (resourceType in resourceInformation) {
                resourceInformation[resourceType] += resourceCount;
            } else {
                resourceInformation[resourceType] = resourceCount;
            }
        } else {
            this.resourceMap[pointstr] = {};
            this.resourceMap[pointstr][resourceType] = resourceCount;
        }
    }

    place_resource(x: number, y: number, resourceType: string, resourceCount: number): void {
        // Condition check boundary
        if (x >= this.boundary || y >= this.boundary || x < 0 || y < 0 ) {
            return; // Silently not place things that are outside of map
        }
        let pointstr = ResourceMap.pointToStr(x, y);
        this.place_resource_with_position(pointstr, resourceType, resourceCount);
    }

    get_resource(x: number, y: number) : { [key: string]: number } {
        let pointstr = ResourceMap.pointToStr(x, y);
        if (pointstr in this.resourceMap) {
            return this.resourceMap[pointstr];
        } else {
            return {};
        }
    }

    get_resource_type(x: number, y: number, resourceType: string) : number {
        let pointstr = ResourceMap.pointToStr(x, y);
        if (pointstr in this.resourceMap) {
            if (resourceType in this.resourceMap[pointstr]) {
                return this.resourceMap[pointstr][resourceType];
            }
        }
        return 0;
    }
}

export function createMapCache(geography: number[][]) : { [location: string] : LocalInformation } {
    let result: { [location: string] : LocalInformation } = {};
    for (let x = 0; x < geography.length; x++) {
        for (let y = 0; y < geography.length; y++) {
            let location = ResourceMap.pointToStr(x, y);
            let terrainType = geography[x][y];
            let local: LocalInformation = {
                geography: terrainType,
                isCoast: false,
            }
            result[location] = local;
        }
    }
    // 2 pass for coast
    let coastCount = 0;
    for (let [location, info] of Object.entries(result)) {
        let point: Point = JSON.parse(location);
        let north = ResourceMap.pointToStr(point.x, point.y+1);
        let south = ResourceMap.pointToStr(point.x, point.y-1);
        let east = ResourceMap.pointToStr(point.x+1, point.y);
        let west = ResourceMap.pointToStr(point.x-1, point.y);
        for (let direction of [north, east, west, south]) {
            if (info.geography > 0 && direction in result && result[direction].geography < 1) {
                info.isCoast = true;
                coastCount += 1;
                break;
            }
        }
    }
    console.log('COASTAL: ' + coastCount);
    return result;
}
