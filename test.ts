// import { Matrix } from "./map";
import * as maputil from "./map/mapUtil";
import { Simulation } from "./simulation/simulation";

// let bfsmap = new maputil.bfsMap(20, 0);
// console.log(bfsmap.get_matrix());

// let map = new maputil.TerrainMap(10);
// console.log(map.map);
//
// let anotherMap = new maputil.TerrainMap(20);
// console.log(anotherMap.map);
//

let simulation: Simulation = new Simulation();
simulation.generate();
console.log(simulation.people);
simulation.next_round();

console.log(simulation.get_people_for_show());
console.log(simulation.effort_map);
for (let value of Object.values(simulation.effort_map.resourceMap)) {
    console.log(value.resource)
}
console.log(simulation.production_map);
for (let value of Object.values(simulation.production_map.resourceMap)) {
    console.log(value.resource)
}
console.log(simulation.draft_map);
for (let value of Object.values(simulation.draft_map.resourceMap)) {
    console.log(value.resource)
}
console.log(simulation.income_by_people);
console.log(simulation.people);
