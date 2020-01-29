import { TYPE_MAP } from "./person_types";

let consumption = (person) => {
    return TYPE_MAP[person.type].consumption;
}

export const RADIUS_MODIFIERS = {
    FISH: (person) : number => {
        let wood_needed = consumption(person)["WOOD"];
        let wood_lacked = 0;
        if ("WOOD" in person.deficit) {
            wood_lacked = person.deficit["WOOD"];
        }
        let scale_modifier = (wood_needed - wood_lacked)/wood_needed;
        return scale_modifier * 1;
    },
    WHAL: (person) : number => {
        let wood_needed = consumption(person)["WOOD"];
        let wood_lacked = 0;
        if ("WOOD" in person.deficit) {
            wood_lacked = person.deficit["WOOD"];
        }
        let scale_modifier = (wood_needed - wood_lacked)/wood_needed;
        return scale_modifier * 2;
    }
}

export const STRENGTH_MODIFIERS = {
    FARM: (person) : number => {
        let tool_needed = consumption(person)["TOOL"];
        let tool_lacked = 0;
        if ("TOOL" in person.deficit) {
            tool_lacked = person.deficit["TOOL"];
        }
        let scale_modifier = (tool_needed - tool_lacked)/tool_needed;
        return scale_modifier;
    },
    WOOD: (person) : number => {
        let tool_needed = consumption(person)["TOOL"];
        let tool_lacked = 0;
        if ("TOOL" in person.deficit) {
            tool_lacked = person.deficit["TOOL"];
        }
        let scale_modifier = (tool_needed - tool_lacked)/tool_needed;
        return scale_modifier;
    },
}

export const PRIVATE_ENTEPRISE = {
    // Private production, free market enteprise!
    TOOL: (person) : number => {
        let wood_needed = consumption(person)["WOOD"];
        let wood_lacked = 0;
        if ("WOOD" in person.deficit) {
            wood_lacked = person.deficit["WOOD"];
        }
        let scale_modifier = (wood_needed - wood_lacked)/wood_needed;
        return (scale_modifier * 2 + 1)/3;
    }
}
