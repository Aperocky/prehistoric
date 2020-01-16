export const RESOURCE_TYPE = {
    FOOD: "FOOD"
}

export const PRODUCE_MAP = {
    "FARM": farmProduction,
    "FISH": fishProduction,
    "HUNT": gathererProduction,
};

export const PRODUCE_TYPE = {
    "FARM": RESOURCE_TYPE.FOOD,
    "FISH": RESOURCE_TYPE.FOOD,
    "HUNT": RESOURCE_TYPE.FOOD,
};

function roundToCent(num: number) : number {
    return Math.floor(num*100)/100;
}

function farmProduction(strength: number, terrain: number, buildings) : number {
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
    let produce: number;
    if (strength < 1) {
        produce = strength;
    } else {
        produce = Math.sqrt(strength)
    }
    produce *= terrainModifier;
    return roundToCent(produce);
}

function gathererProduction(strength: number, terrain: number, buildings) : number {
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

function fishProduction(strength: number, terrain: number, buildings) : number {
    let terrainModifiers = {
        0: 1,
        1: 0.5,
    };
    let terrainModifier: number;
    if (!(terrain in terrainModifiers)) {
        return 0;
    } else {
        terrainModifier = terrainModifiers[terrain];
    }
    let produce: number
    if (strength < 0.7){
        produce = strength;
    } else {
        produce = 0.7 - (strength - 1)/20; // Overfishing
    }
    produce *= terrainModifier;
    return roundToCent(produce);
}
