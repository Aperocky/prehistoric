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
    if (val == Number.NaN) {
        console.log(`NaN Found During: ${log_string}`);
        return;
    }
    if (key in obj) {
        obj[key] += val;
    } else {
        obj[key] = val;
    }
}
