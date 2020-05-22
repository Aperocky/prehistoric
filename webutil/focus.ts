// Functions to manipulate focus in rendering
export class Focus {
    private focus_set: boolean;
    private focus_type: string;
    private focus_map: { [foci: string] : string };

    constructor() {
        this.focus_set = false;
        this.focus_type = "NONE";
        this.focus_map = {
            person: "NONE",
            location: "NONE",
        };
    }

    isFocusSet(): boolean {
        return this.focus_set;
    }

    getFocusType(): string {
        return this.focus_type;
    }

    getFocusValue(): string {
        if (this.focus_set) {
            return this.focus_map[this.focus_type];
        }
        return "NONE";
    }

    removeFocus(): void {
        if (!(this.focus_set)) {
            return;
        }
        this.focus_map[this.focus_type] = "NONE";
        this.focus_type = "NONE";
        this.focus_set = false;
    }

    setFocus(foci: string, value: string): void {
        if (!(foci in this.focus_map)) {
            return;
        }
        if (this.focus_set) {
            this.focus_map[this.focus_type] = "NONE";
        }
        this.focus_map[foci] = value;
        this.focus_type = foci;
        this.focus_set = true;
    }

    log(): void {
        console.log(`Current Focus: ${this.focus_type}: ${this.focus_map}. Status: ${this.focus_set}`);
    }
}
