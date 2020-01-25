// Language features that should be there but are not.

export function sortObject(obj: {[key:string]: number}) {
    let arr = []
    for (let [key, val] of Object.entries(obj)) {
        arr.push([key, val]);
    }
    arr.sort((a, b) => {
        return b[1] - a[1];
    });
    return arr;
}
