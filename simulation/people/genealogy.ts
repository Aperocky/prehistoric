import { Person } from "./person";

export type Record = {
    id: string;
    name: string;
    bturn: number;
    dturn: number | null;
    mother: string;
    children: string[];
}

function create_record(person: Person, turn: number, mother="NATURIL"): Record {
    return {
        id: person.unique_id,
        name: person.name,
        bturn: turn,
        dturn: null,
        mother: mother,
        children: [],
    }
}

export class Genealogy {
    records: { [id: string]: Record };

    constructor(people: Person[]) {
        this.records = {};
        this.records["NATURIL"] = {
            id: "NATURIL",
            name: "MOTHER NATURE",
            bturn: -100,
            dturn: null,
            mother: "GOD",
            children: [],
        }
        for (let person of people) {
            this.records[person.unique_id] = create_record(person, 0-person.age);
        }
    }

    funeral(person: Person, turn: number): void {
        this.records[person.unique_id].dturn = turn;
    }

    birth(person: Person, mother: Person, turn: number) {
        this.records[mother.unique_id].children.push(person.unique_id);
        this.records[person.unique_id] = create_record(person, turn, mother.unique_id);
    }

    get_parent(person: Person): Record {
        return this.records[this.records[person.unique_id].mother]
    }

    get_children(person: Person): Record[] {
        return this.records[person.unique_id].children.map(
            id => this.records[id]
        );
    }

    get_sibling(person: Person): Record[] {
        return this.records[this.records[person.unique_id].mother].children.map(
            id => this.records[id]
        );
    }
}
