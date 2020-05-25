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
        let tool_needed = lang.get_numeric_value(consumption(person), "TOOL");
        let tool_lacked = lang.get_numeric_value(person.deficit, "TOOL");
        let scale_modifier = 0
        if (wood_needed > 0) {
            scale_modifier += (wood_needed - wood_lacked)/wood_needed;
        }
        if (tool_needed > 0) {
            scale_modifier += (tool_needed - tool_lacked)/tool_needed;
        }
        return scale_modifier * 2; // Max Range = 5
    },
}

export const STRENGTH_MODIFIERS = {
    FARM: (person) : number => {
        let tool_needed = lang.get_numeric_value(consumption(person), "TOOL");
        let tool_lacked = lang.get_numeric_value(person.deficit, "TOOL");
        let scale_modifier = 0;
        if (tool_needed > 0) {
            scale_modifier = (tool_needed - tool_lacked)/tool_needed;
        }
        if ("FARM" in person.market.experience) {
            scale_modifier *= (1 + person.market.experience["FARM"]/40);
        }
        return scale_modifier;
    },
    WOOD: (person) : number => {
        let tool_needed = lang.get_numeric_value(consumption(person), "TOOL");
        let tool_lacked = lang.get_numeric_value(person.deficit, "TOOL");
        let scale_modifier = 0;
        if (tool_needed > 0) {
            scale_modifier = (tool_needed - tool_lacked)/tool_needed;
        }
        if ("WOOD" in person.market.experience) {
            scale_modifier += person.market.experience["WOOD"]/40;
        }
        return scale_modifier;
    },
    TRAD: (person) : number => {
        let scale_modifier = 0;
        if ("TRAD" in person.market.experience) {
            scale_modifier += person.market.experience["TRAD"]/10;
        }
        return scale_modifier;
    }
}

export const DRAFT_MODIFIERS = {
    TRAD: (person): number => {
        let scale_modifier = 0;
        if ("TRAD" in person.market.experience) {
            scale_modifier += person.market.experience["TRAD"]/20;
        }
        return scale_modifier;
    },
    FISH: (person): number => {
        let scale_modifier = 0;
        if ("FISH" in person.market.experience) {
            scale_modifier += person.market.experience["FISH"]/100;
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
        if ("TOOL" in person.market.experience) {
            scale_modifier += person.market.experience["TOOL"]/40;
            scale_modifier *= (1 + person.market.experience["TOOL"]/40);
        }
        return (scale_modifier * 5 + 1)/3;
    }
}
