export const RESOURCE_TYPE = {
    FOOD: "FOOD",
    GOLD: "GOLD",
    WOOD: "WOOD",
    TOOL: "TOOL",
}

export const PRODUCE_MAP = {
    "FARM": farmProduction,
    "FISH": fishProduction,
    "HUNT": gathererProduction,
    "TRAD": tradeProduction,
    "WOOD": woodProduction,
    "TOOL": toolProduction,
};

export const PRODUCE_TYPE = {
    "FARM": RESOURCE_TYPE.FOOD,
    "FISH": RESOURCE_TYPE.FOOD,
    "HUNT": RESOURCE_TYPE.FOOD,
    "TRAD": RESOURCE_TYPE.GOLD,
    "WOOD": RESOURCE_TYPE.WOOD,
    "TOOL": RESOURCE_TYPE.TOOL,
};

function roundToCent(num: number) : number {
    return Math.floor(num*100)/100;
}

function woodProduction(strength: number, terrain: number, building) : number {
    let terrainModifiers = {
        3: 1,
    };
    let terrainModifier: number;
    if (!(terrain in terrainModifiers)) {
        return 0;
    } else {
        terrainModifier = terrainModifiers[terrain];
    }
    let produce: number;
    if (strength < 4){
        produce = strength;
    } else {
        produce = 4; // Cap on tree farming
    }
    produce *= terrainModifier;
    return roundToCent(produce);
}

function tradeProduction(strength: number, terrain: number, building) : number {
    let terrainModifier = 0.5; // Trader only cares about buildings.
    if (building) {
        if (building.type == "TOWN") {
            terrainModifier = 0.75;
        } else if (building.type == "CITY") {
            terrainModifier = 1;
        }
    }
    // The more trader the more gold (inflation)
    let produce = Math.sqrt(strength) * strength;
    produce *= terrainModifier;
    return roundToCent(produce);
}

function farmProduction(strength: number, terrain: number, building) : number {
    let terrainModifiers = {
        2: 1,
        3: 0.25,
    };
    let terrainModifier: number;
    if (!(terrain in terrainModifiers)) {
        return 0;
    } else {
        terrainModifier = terrainModifiers[terrain];
    }
    if (building && building.type == "FARM") {
        terrainModifier *= 1.25;
    }
    let produce: number;
    if (strength < 1) {
        produce = strength;
    } else {
        produce = Math.sqrt(strength)
    }
    produce *= terrainModifier;
    return roundToCent(produce);
}

function gathererProduction(strength: number, terrain: number, building) : number {
    let terrainModifiers = {
        1: 0.2,
        2: 0.5,
        3: 1,
    };
    let terrainModifier: number;
    if (!(terrain in terrainModifiers)) {
        return 0;
    } else {
        terrainModifier = terrainModifiers[terrain];
    }
    let produce: number;
    if (strength < 0.5){
        produce = strength;
    } else {
        produce = 0.5; // max for living off the land.
    }
    produce *= terrainModifier;
    return roundToCent(produce);
}

function fishProduction(strength: number, terrain: number, building) : number {
    let terrainModifiers = {
        0: 1,
        "-1": 0.75,
    };
    let terrainModifier: number;
    if (!(terrain in terrainModifiers)) {
        return 0;
    } else {
        terrainModifier = terrainModifiers[terrain];
    }
    let produce: number
    if (strength < 1.5){
        produce = strength;
    } else {
        produce = 1.5 - (strength - 1.5)/10; // Overfishing
    }
    produce *= terrainModifier;
    return roundToCent(produce);
}

function toolProduction(strength: number, terrain: number, building) : number {
    // TOOL PRODUCTION IS PRIVATE ENTEPRISE!
    // It does not go through public distribution channels.
    return 0;
}
