import * as resources from "./resources";

const FOOD: string = resources.RESOURCE_TYPE.FOOD;

export type Person = {
    x: number;
    y: number;
    income: { [key: string]: number };
    store: { [key: string]: number };
    type: string;
    name: string;
    unique_id: string;
}

export class PersonUtil {

    static get_type_def(person: Person): PersonType {
        return TYPE_MAP[person.type];
    }

    static get_work_radius(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        return typedef.work_radius;
    }

    static get_work_strength(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        return typedef.work_strength;
    }

    static get_travel(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        return typedef.travel;
    }

    static get_home(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        return typedef.home;
    }

    static get_consumption(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        return typedef.consumption;
    }

    static get_max_store(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        return typedef.max_store;
    }

    static get_draft(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        return typedef.draft;
    }

    static get_change_func(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        return typedef.change_func;
    }

    static get_replicate_func(person: Person) {
        let typedef = PersonUtil.get_type_def(person);
        return typedef.replicate_func;
    }
}

type PersonType = {
    type: string;
    travel: number;
    home: number;
    work_strength: number;
    work_radius: number;
    draft: { [key: string]: number[] };
    // draft; [FOOD: [radius, strength]];
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
    work_radius: 1.5,
    draft: {
        FOOD: [1.5, 1]
    },
    consumption: {
        FOOD : 0.5
    },
    max_store: {
        FOOD : 5
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
    work_radius: 1.5,
    draft: {
        FOOD: [1.5, 1]
    },
    consumption: {
        FOOD : 0.5
    },
    max_store: {
        FOOD : 5 
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
    draft: {
        FOOD: [0, 1]
    },
    consumption: {
        FOOD : 0.5
    },
    max_store: {
        FOOD : 5
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
