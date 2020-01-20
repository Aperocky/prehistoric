import { StatisticsReport } from "../simulation/simutil";
import { DISPLAY_TYPE } from "../simulation/person";
import { Person } from "../simulation/person";
import { Building } from "../simulation/buildings";

export function clearDiv(div) {
    // Remove every zig
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
}

export function addInfoField(text, color="") {
    let pfie = document.createElement("p");
    pfie.className = "infofield"
    let cleantext = text.replace(/(\.\d{2})\d*/, "$1");
    if (color) {
        pfie.style.color = color;
    }
    pfie.textContent = cleantext;
    return pfie;
}

export function startingHelp(siminfobox) {
    clearDiv(siminfobox);
    siminfobox.appendChild(addInfoField("Get started: ", "#999"));
    siminfobox.appendChild(addInfoField("Change the map by RE-GENERATE", "#999"));
    siminfobox.appendChild(addInfoField("RUN-TURN to start simulation", "#999"));
    siminfobox.appendChild(addInfoField("=============================", "#888"));
    siminfobox.appendChild(addInfoField("Everyone starts as gatherer, but they can change with circumstances", "#999"));
    siminfobox.appendChild(addInfoField("Each tile display a max of 15 people, more info can be found by clicking on land itself", "#999"));
    siminfobox.appendChild(addInfoField("By default, people are shown, click SHOW to toggle", "#999"));
    siminfobox.appendChild(addInfoField("=============================", "#888"));
    siminfobox.appendChild(addInfoField("# Special thanks to Anuken for sprites", "#999"));
}

export function splitLine(siminfobox) {
    siminfobox.appendChild(addInfoField("=============================", "#999"));
}

export function objectToLines(siminfobox, target, translate_dict: object | null = null) {
    for (let [key, value] of Object.entries(target)) {
        if (translate_dict) {
            key = translate_dict[key];
        }
        siminfobox.appendChild(addInfoField(`${key}: ${value}`));
    }
}

export function visualizePeopleGroup(siminfobox, report: StatisticsReport) : void {
    siminfobox.appendChild(addInfoField(`TOTAL POPULATION: ${report.population}`));
    siminfobox.appendChild(addInfoField(`AVERAGE AGE: ${report.average_age}`));
    splitLine(siminfobox);
    siminfobox.appendChild(addInfoField(`TOTAL INCOME`));
    objectToLines(siminfobox, report.total_income);
    splitLine(siminfobox);
    siminfobox.appendChild(addInfoField(`TOTAL CONSUMPTION`));
    objectToLines(siminfobox, report.total_consumption);
    splitLine(siminfobox);
    siminfobox.appendChild(addInfoField("TOTAL WEALTH"));
    objectToLines(siminfobox, report.total_wealth);
    splitLine(siminfobox);
    siminfobox.appendChild(addInfoField("COMPOSITION"));
    objectToLines(siminfobox, report.composition, DISPLAY_TYPE);
    splitLine(siminfobox);
}

export function visualizePerson(siminfobox, person: Person, detailed=true) : void {
    if (detailed) {
        siminfobox.appendChild(addInfoField(`Name: ${person.name}`));
        siminfobox.appendChild(addInfoField(`Occupation: ${DISPLAY_TYPE[person.type]}`));
        siminfobox.appendChild(addInfoField(`Age: ${person.age}`));
        splitLine(siminfobox);
        siminfobox.appendChild(addInfoField("Income: "))
        objectToLines(siminfobox, person.income);
        siminfobox.appendChild(addInfoField("Storage: "))
        objectToLines(siminfobox, person.store);
        if (person.eventlog) {
            siminfobox.appendChild(addInfoField(`Message: ${person.eventlog}`));
        }
    } else {
        siminfobox.appendChild(addInfoField(`${person.name}, ${DISPLAY_TYPE[person.type]}`));
        siminfobox.appendChild(addInfoField("Age: " + person.age));
        if (person.eventlog) {
            siminfobox.appendChild(addInfoField(`Message: ${person.eventlog}`));
        }
        siminfobox.appendChild(addInfoField("--------------------------", "#999"));
    }
}

export function visualizeBuilding(siminfobox, building: Building) {
    siminfobox.appendChild(addInfoField(`Building: ${building.type}`))
    siminfobox.appendChild(addInfoField(`Maintenance: ${building.maintenance}`))
    siminfobox.appendChild(addInfoField(`History: ${building.age} years`))
    splitLine(siminfobox);
}
