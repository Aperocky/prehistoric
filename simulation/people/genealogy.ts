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
    turn_num: number;
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
        this.turn_num = 0;
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
        return this.records[person.unique_id].children.filter(
            id => {
                if (!(id in this.records)) {
                    return false;
                }
                return true;
            }
        ).map(id => this.records[id]);
    }

    get_sibling(person: Person): Record[] {
        return this.records[this.records[person.unique_id].mother].children.map(
            id => this.records[id]
        );
    }

    clear_forgotten(simulation): void {
        let forgotten: string[] = [];
        for (let [id, record] of Object.entries(this.records)) {
            if (id == "NATURIL") {
                continue;
            }
            if (id in simulation.people) {
                continue;
            } else {
                if (!record.dturn) {
                    continue;
                }
                if (this.turn_num - record.dturn < 10) {
                    continue;
                }
                if (record.mother in this.records && record.mother != "NATURIL") {
                    continue;
                }
                let in_living_memory: boolean = false;
                for (let cid of record.children) {
                    if (cid in simulation.people) {
                        in_living_memory = true;
                        break;
                    }
                }
                if (!in_living_memory) {
                    forgotten.push(id);
                }
            }
        }
        console.log(`Removing ${forgotten.length} forgotten people at turn ${this.turn_num}`);
        for (let id of forgotten) {
            delete this.records[id];
        }
    }
}
