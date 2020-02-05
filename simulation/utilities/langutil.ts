// Language features that should be there but are not.

export function sort_object(obj: {[key:string]: number}) {
    let arr = []
    for (let [key, val] of Object.entries(obj)) {
        arr.push([key, val]);
    }
    arr.sort((a, b) => {
        return b[1] - a[1];
    });
    return arr;
}

export function add_value(obj: object, key: string, val: number, log_string="") : void {
    if (key in obj) {
        if (isNaN(obj[key])) {
            throw `NaN Found During: ${log_string}`;
        }
        obj[key] += val;
    } else {
        obj[key] = val;
    }
}

export function get_numeric_value(obj: object, key: string) : number {
    if (key in obj) {
        if (typeof(obj[key]) != "number") {
            throw "CANNOT RETURN NON-NUMERICS";
        }
        if (isNaN(obj[key])) {
            throw "NaN found, quit";
        }
        return obj[key];
    } else {
        return 0;
    }
}

export function obj_addition(sumobj: { [resource: string]: number }, indobj: { [resource: string]: number }) : void {
    for (let [rtype, rcount] of Object.entries(indobj)) {
        if (isNaN(rcount)) {
            throw "NaN found, quit";
        }
        if (rtype in sumobj) {
            sumobj[rtype] += rcount;
        } else {
            sumobj[rtype] = rcount;
        }
    }
}

