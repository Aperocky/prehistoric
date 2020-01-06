import * as resources from "./resources";

const FOOD: string = resources.RESOURCE_TYPE.FOOD;

export type Person = {
    x: number;
    y: number;
    income: { [key: string]: string };
    store: { [key: string]: string };
    type: string;
    name: string;
}

type PersonType = {
    type: string;
    travel: number;
    home: number;
    work_strength: number;
    work_radius: number;
    consumption: { [key: string]: number };
    max_store: { [key: string]: number };
    change_func: Function;
    replicate_func: Function;
}

const fisher: PersonType = {
    type: "FISH",
    travel: 5,
    home: 1,
    work_strength: 0.3,
    work_radius: 1,
    consumption: {
        FOOD : 1
    },
    max_store: {
        FOOD : 10
    },
    change_func: (deficit) => {
        if (Math.random() > deficit[FOOD]/1){
            return "D";
        }
        return "0";
    },
    replicate_func: (store) => {
        return (Math.random()+0.25 < store[FOOD]/10)
    }
}

const hunter: PersonType = {
    type: "HUNT",
    travel: 4,
    home: 1,
    work_strength: 0.2,
    work_radius: 1,
    consumption: {
        FOOD : 1
    },
    max_store: {
        FOOD : 10
    },
    change_func: (deficit) => {
        if (Math.random() > deficit[FOOD]/1){
            return "D";
        }
        return "0";
    },
    replicate_func: (store) => {
        return (Math.random()+0.25 < store[FOOD]/10)
    }
}

const farmer: PersonType = {
    type: "FARM",
    travel: 1,
    home: 0,
    work_strength: 1,
    work_radius: 0,
    consumption: {
        FOOD : 1
    },
    max_store: {
        FOOD : 10
    },
    change_func: (deficit) => {
        if (Math.random() > deficit[FOOD]/1){
            return "D";
        }
        return "0";
    },
    replicate_func: (store) => {
        return (Math.random()+0.25 < store[FOOD]/10)
    }
}

export const TYPE_MAP = {
    "HUNT" : hunter,
    "FARM" : farmer,
    "FISH" : fisher,
}
