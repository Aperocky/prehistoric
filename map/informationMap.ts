import { Point } from "./mapUtil";

type ResourceInformation = {
    resource : { [key: string] : number };
}

type LocalInformation = {
    geography: number;
    isCoast: boolean;
    building: string;
}

function newRI(): ResourceInformation {
    return { resource: {}};
}

export class ResourceMap {
    boundary: number; // Assume square
    resourceMap : { [key: string] : ResourceInformation };

    constructor(boundary: number){
        this.resourceMap = {};
        this.boundary = boundary;
    }

    static pointToStr(x: number, y: number) : string {
        let point: Point = {x: x, y: y};
        return JSON.stringify(point);
    }

    static get_radius_position(x: number, y: number, radius: number) : Point[] {
        let result: Point[] = [];
        let fullrad = Math.floor(radius);
        for (let i = x-fullrad; i <= x+fullrad; i++) {
            for (let j = y-fullrad; j <= y+fullrad; j++) {
                let offset_x = i-x;
                let offset_y = j-y;
                if (offset_x * offset_x + offset_y * offset_y <= radius * radius) {
                    result.push({x: i, y: j});
                }
            }
        }
        return result;
    }

    place_resource_with_position(pointstr: string, resourceType: string, resourceCount: number): void {
        if (pointstr in this.resourceMap) {
            let resourceInformation: ResourceInformation = this.resourceMap[pointstr];
            if (resourceType in resourceInformation.resource) {
                resourceInformation.resource[resourceType] += resourceCount;
            } else {
                resourceInformation.resource[resourceType] = resourceCount;
            }
        } else {
            this.resourceMap[pointstr] = newRI();
            this.resourceMap[pointstr].resource[resourceType] = resourceCount;
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

    get_resource(x: number, y: number) : ResourceInformation {
        let pointstr = ResourceMap.pointToStr(x, y);
        if (pointstr in this.resourceMap) {
            return this.resourceMap[pointstr];
        } else {
            return newRI();
        }
    }

    get_resource_type(x: number, y: number, resourceType: string) : number {
        let pointstr = ResourceMap.pointToStr(x, y);
        if (pointstr in this.resourceMap) {
            if (resourceType in this.resourceMap[pointstr].resource) {
                return this.resourceMap[pointstr].resource[resourceType];
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
                building: "",
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
