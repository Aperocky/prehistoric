import { Point } from "./mapUtil";

type ResourceInformation = {
    resource : { [key: string] : number };
    building : string;
}

function newRI(): ResourceInformation {
    return { resource: {}, building: "" };
}

export class ResourceMap {
    resourceMap : { [key: string] : ResourceInformation }

    constructor(){
        this.resourceMap = {};
    }

    static pointToStr(x: number, y: number) : string {
        let point: Point = {x: x, y: y};
        return JSON.stringify(point);
    }

    placeResource(x: number, y: number, resourceType: string, resourceCount: number): void {
        let pointstr = ResourceMap.pointToStr(x, y);
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

    getResource(x: number, y: number) : ResourceInformation {
        let pointstr = ResourceMap.pointToStr(x, y);
        if (pointstr in this.resourceMap) {
            return this.resourceMap[pointstr];
        } else {
            return newRI();
        }
    }

    getResourceType(x: number, y: number, resourceType: string) : number {
        let pointstr = ResourceMap.pointToStr(x, y);
        if (pointstr in this.resourceMap) {
            if (resourceType in this.resourceMap[pointstr].resource) {
                return this.resourceMap[pointstr].resource[resourceType];
            }
        }
        return 0;
    }
}
