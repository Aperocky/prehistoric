import { TYPE_MAP } from "./person_types";
import * as lang from "../utilities/langutil";
import { PersonUtil } from "./person";

let consumption = (person) => {
    return PersonUtil.get_consumption(person);
}

export const RADIUS_MODIFIERS = {
    FISH: (person) : number => {
        let wood_needed = lang.get_numeric_value(consumption(person), "WOOD");
        let wood_lacked = lang.get_numeric_value(person.deficit, "WOOD");
        let scale_modifier = 0
        if (wood_needed > 0) {
            scale_modifier = (wood_needed - wood_lacked)/wood_needed;
        }
        return scale_modifier * 1;
    },
    WHAL: (person) : number => {
        let wood_needed = lang.get_numeric_value(consumption(person), "WOOD");
        let wood_lacked = lang.get_numeric_value(person.deficit, "WOOD");
        let scale_modifier = 0
        if (wood_needed > 0) {
            scale_modifier = (wood_needed - wood_lacked)/wood_needed;
        }
        return scale_modifier * 2;
    }
}

export const STRENGTH_MODIFIERS = {
    FARM: (person) : number => {
        let tool_needed = lang.get_numeric_value(consumption(person), "TOOL");
        let tool_lacked = lang.get_numeric_value(person.deficit, "TOOL");
        let scale_modifier = 0
        if (tool_needed > 0) {
            scale_modifier = (tool_needed - tool_lacked)/tool_needed;
        }
        return scale_modifier;
    },
    WOOD: (person) : number => {
        let tool_needed = lang.get_numeric_value(consumption(person), "TOOL");
        let tool_lacked = lang.get_numeric_value(person.deficit, "TOOL");
        let scale_modifier = 0
        if (tool_needed > 0) {
            scale_modifier = (tool_needed - tool_lacked)/tool_needed;
        }
        return scale_modifier;
    },
}

export const PRIVATE_ENTEPRISE = {
    // Private production, free market enteprise!
    TOOL: (person) : number => {
        let wood_needed = lang.get_numeric_value(consumption(person), "WOOD");
        let wood_lacked = lang.get_numeric_value(person.deficit, "WOOD");
        let scale_modifier = 0
        if (wood_needed > 0) {
            scale_modifier = (wood_needed - wood_lacked)/wood_needed;
        }
        return (scale_modifier * 2 + 1)/3;
    }
}
