import { StatisticsReport } from "../simulation/utilities/simutil";
import { Person, PersonUtil, DISPLAY_TYPE } from "../simulation/people/person";
import { Genealogy, Record } from "../simulation/people/genealogy";
import { PRODUCE_TYPE } from "../simulation/resources";
import { Building } from "../simulation/buildings";
import { MarketConditions } from "../simulation/market";
import * as lang from "../simulation/utilities/langutil";

const rtypeColor = {
    "FOOD": "#fdb",
    "WOOD": "#8e4",
    "TOOL": "#adc",
}

export function visualizeMarketCondition(siminfobox, market_condition: MarketConditions) {
    siminfobox.appendChild(addInfoField(`MARKET`, "#0a0"));
    let tableHeaders = getTableLine(["Resource", "Attribute", "Quantity"], 13);
    siminfobox.appendChild(addInfoField(tableHeaders, "#595", "pre"));
    for (let rtype of Object.keys(market_condition.supply)) {
        if (market_condition.supply[rtype] == 0) {
            continue;
        }
        let color = rtypeColor[rtype];
        let supply = market_condition.supply[rtype].toString();
        let demand = market_condition.demand[rtype].toString();
        let price = market_condition.pricing[rtype].toString();
        let volume = market_condition.activity[rtype].toString();
        let total = (market_condition.pricing[rtype] * market_condition.activity[rtype]).toString();
        siminfobox.appendChild(addInfoField(getTableLine([rtype, "SUPPLY", supply], 13), color, "pre"));
        siminfobox.appendChild(addInfoField(getTableLine([rtype, "DEMAND", demand], 13), color, "pre"));
        siminfobox.appendChild(addInfoField(getTableLine([rtype, "PRICE", price], 13), color, "pre"));
        siminfobox.appendChild(addInfoField(getTableLine([rtype, "VOLUME", volume], 13), color, "pre"));
        siminfobox.appendChild(addInfoField(getTableLine([rtype, "SUM", total], 13), color, "pre"));
    }
    splitLine(siminfobox);
}

export function clearDiv(div) {
    // Remove every zig
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
}

export function addInfoField(text, color="", tag="p") {
    let pfie = document.createElement(tag);
    pfie.className = "infofield"
    let cleantext = text.replace(/(\.\d{2})\d*/g, "$1");
    if (color) {
        pfie.style.color = color;
    } else {
        pfie.style.color = "#eee";
    }
    pfie.textContent = cleantext;
    return pfie;
}

export function startingHelp(siminfobox) {
    clearDiv(siminfobox);
    siminfobox.appendChild(addInfoField("Get started: ", "#999"));
    siminfobox.appendChild(addInfoField("RE-GENERATE to change the map", "#999"));
    siminfobox.appendChild(addInfoField("RUN-TURN to start simulation", "#999"));
    siminfobox.appendChild(addInfoField("=============================", "#888"));
    siminfobox.appendChild(addInfoField("Everyone starts as gatherer, but they can change with circumstances", "#999"));
    siminfobox.appendChild(addInfoField("Each tile display a max of 15 people, more info can be found by clicking on land itself", "#999"));
    siminfobox.appendChild(addInfoField("By default, people are shown, click SHOW to toggle", "#999"));
    siminfobox.appendChild(addInfoField("Wood is vital to the fishing economy, try generate maps that have wood", "#999"));
    siminfobox.appendChild(addInfoField("Also water.", "#999"));
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

let visualizeLivingStandard = (siminfobox, state, obj) => {
    for (let [key, value] of Object.entries(obj)) {
        siminfobox.appendChild(addInfoField(getTableLine([state, key, value.toString()], 13), "#cce", "pre"))
    }
}

export function visualizePeopleGroup(siminfobox, report: StatisticsReport) : void {
    let peopleColor = "#abe"
    siminfobox.appendChild(addInfoField(`PEOPLE`, peopleColor));
    siminfobox.appendChild(addInfoField(getTableLine(["Population", report.population.toString()], 13), peopleColor, "pre"));
    siminfobox.appendChild(addInfoField(getTableLine(["Average Age", report.average_age.toString()], 13), peopleColor, "pre"));
    splitLine(siminfobox);
    siminfobox.appendChild(addInfoField(`LIVING STANDARD`, "#cce"));
    let tableHeaders = getTableLine(["Action", "Resource", "Quantity"], 13);
    siminfobox.appendChild(addInfoField(tableHeaders, "#cce", "pre"));
    visualizeLivingStandard(siminfobox, "INCOME", report.total_income);
    visualizeLivingStandard(siminfobox, "CONSUMPTION", report.total_consumption);
    visualizeLivingStandard(siminfobox, "WEALTH", report.total_wealth);
    splitLine(siminfobox);
    siminfobox.appendChild(addInfoField("OCCUPATIONS", "#ecc"));
    let occupations = lang.sort_object(report.composition);
    for (let occ of occupations) {
        siminfobox.appendChild(addInfoField(getTableLine([DISPLAY_TYPE[occ[0]], occ[1].toString()], 13), "#ecc", "pre"));
    }
    splitLine(siminfobox);
}

function getFormatString(str, total_space: number) : string {
    // Deal with numbers
    let formatstr = str.replace(/(\.\d{2})\d*/g, "$1");
    let halflength = Math.floor((total_space - formatstr.length)/2)
    return Array(halflength+1).join(" ") + formatstr + Array(total_space - halflength - formatstr.length + 1).join(" ");
}

function getTableLine(argv, table_width=10): string {
    let allStr = [];
    for (let str of argv) {
        allStr.push(getFormatString(str, table_width));
    }
    return allStr.join("|");
}

function objectToPersonalTable(mc, siminfobox, obj: {[key:string]:number}, state, color="#eee") {
    for (let [key, value] of Object.entries(obj)) {
        let tableLine: string;
        if (key == "GOLD") {
            tableLine = getTableLine([key, state, "N/A", value.toString()]);
            siminfobox.appendChild(addInfoField(tableLine, color, "pre"));
        } else {
            let price = (value * mc.pricing[key]).toString();
            tableLine = getTableLine([key, state, value.toString(), price]);
            siminfobox.appendChild(addInfoField(tableLine, color, "pre"));
        }
    }
}

let yearling = (y) => (4500 - y).toString() + " BC";

function visualizeRecord(siminfobox, record: Record) {
    let dturn: string = record.dturn ? yearling(record.dturn) : "";
    siminfobox.appendChild(addInfoField(`${record.name}, ${yearling(record.bturn)} - ${dturn}`));
}

function visualizeFamily(siminfobox, genealogy: Genealogy, person: Person): void {
    siminfobox.appendChild(addInfoField(`Parent`, "#99a"));
    visualizeRecord(siminfobox, genealogy.get_parent(person));
    siminfobox.appendChild(addInfoField(`Siblings`, "#9a9"));
    for (let record of genealogy.get_sibling(person)) {
        if (record.id == person.unique_id) {
            continue;
        }
        visualizeRecord(siminfobox, record);
    }
    siminfobox.appendChild(addInfoField(`Children`, "#a99"));
    for (let record of genealogy.get_children(person)) {
        visualizeRecord(siminfobox, record);
    }
}

export function visualizePerson(sim, siminfobox, person: Person, detailed=true) : void {
    let mc = sim.market_conditions;
    if (detailed) {
        siminfobox.appendChild(addInfoField(`Name: ${person.name}`));
        siminfobox.appendChild(addInfoField(`Occupation: ${DISPLAY_TYPE[person.type]}`));
        siminfobox.appendChild(addInfoField(`Age: ${person.age}`));
        splitLine(siminfobox);

        // Adding table about resource and income information
        let tableHeaderLine = getTableLine(["Resource", "Action", "Quantity", "Price"]);
        siminfobox.appendChild(addInfoField(tableHeaderLine, "#9a5", "pre"));
        objectToPersonalTable(mc, siminfobox, person.income, "INCOME", "#9e9");
        if ("SELL" in person.transactions || "BUY" in person.transactions) {
            for (let [state, stateval] of Object.entries(person.transactions)) {
                for (let [key, val] of Object.entries(stateval)) {
                    let tableLine = getTableLine([key, state, val[0].toString(), val[1].toString()]);
                    siminfobox.appendChild(addInfoField(tableLine, "#99e", "pre"));
                }
            }
        }
        if ("SUPPORT" in person.family_support || "RECEIVE" in person.family_support) {
            for (let [state, stateval] of Object.entries(person.family_support)) {
                for (let [key, val] of Object.entries(stateval)) {
                    let total_value = lang.get_numeric_value(mc.pricing, key) * val;
                    let tableLine = getTableLine([key, state, val.toString(), total_value.toString()]);
                    siminfobox.appendChild(addInfoField(tableLine, "#e99", "pre"));
                }
            }
        }
        objectToPersonalTable(mc, siminfobox, PersonUtil.get_real_consumption(person), "CONSUME", "#abc");
        objectToPersonalTable(mc, siminfobox, person.store, "STORAGE", "#f5deb3");
        siminfobox.appendChild(addInfoField(`NET WORTH: ${PersonUtil.get_net_worth(person, mc)}`, "#d4af37", "pre"));

        splitLine(siminfobox);
        visualizeFamily(siminfobox, sim.genealogy, person);

        // Adding table about work information
        if (person.type != "MORT") {
            splitLine(siminfobox);
            let workHeader = getTableLine(["Resource", "Work", "Radius", "Strength"]);
            siminfobox.appendChild(addInfoField(workHeader, "#feb", "pre"));
            let workResource = PRODUCE_TYPE[PersonUtil.get_production_type(person)];
            let workStrength = PersonUtil.get_work_strength(person);
            let workRadius = PersonUtil.get_work_radius(person);
            let personDraft = PersonUtil.get_draft(person, sim.genealogy);
            let workLine = getTableLine([workResource, "PRODUCE", workRadius.toString(), workStrength.toString()]);
            siminfobox.appendChild(addInfoField(workLine, "#feb", "pre"));
            for (let key of Object.keys(personDraft)) {
                let draftLine = getTableLine([key, "DRAFT", personDraft[key][0].toString(), personDraft[key][1].toString()]);
                siminfobox.appendChild(addInfoField(draftLine, "#feb", "pre"));
            }
        }
        

        // Add message if any
        if (person.eventlog) {
            splitLine(siminfobox);
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
