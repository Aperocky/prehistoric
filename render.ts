import * as PIXI from "pixi.js";
import * as WebUtil from "./webutil/webutil";
import { Focus } from "./webutil/focus";
import { Simulation, FIXED_MAP_SIZE } from "./simulation/simulation";
import { ResourceMap } from "./map/informationMap";
import { DISPLAY_TYPE } from "./simulation/people/person";
import { BureauOfStatistics } from "./simulation/utilities/simutil";

// Buttons
const logButton = document.getElementById("logbut");
const decadeBut = document.getElementById("decade");
const showButton = document.getElementById("showbut");
showButton.style.borderStyle = "inset";
const runTurnButton = document.getElementById("maketurn");
const regenButton = document.getElementById("regen");
const yearDisplay = document.getElementById("yearfill");

const SPRITE_SIZE = 32;
const app = new PIXI.Application({
    width: 640, height: 640
});
let gamezone = document.getElementById("mapspace");
gamezone.appendChild(app.view);
app.renderer.plugins.interaction.autoPreventDefault = false;

// ---------------------------------------------------------------------------
// Load resources for map, initiate persisting variables
// ---------------------------------------------------------------------------

let loader = new PIXI.Loader();
loader.add("assets/blocks/packed/groundpak2.json");
let sheet;

loader.onError.add((error) => console.error(error));
loader.load((loader) => {
    sheet = loader.resources["assets/blocks/packed/groundpak2.json"].spritesheet;
    generateContainer();
});

const simulation = new Simulation();
const mapContainer = new PIXI.Container();
app.stage.addChild(mapContainer);
const siminfobox = document.getElementById("siminfobox");
const publicRenderer = PIXI.RenderTexture.create();

// Stateful variables that need to exist outside functions
let peopleSprites: PIXI.Sprite[];
let buildingSprites: { [key: string]: PIXI.Sprite };
let people_shown = true;
const focus = new Focus();

const textureMap = {
    "-1": ["deepwater"],
    0: ["water"],
    1: ["sand1", "sand2", "sand3"],
    2: ["grass1", "grass2", "grass3"],
    3: ["shrubs1", "shrubs2"],
    4: ["rocks1", "rocks2"],
    100: ["farm1", "farm2"],
    101: ["town1", "town2"],
    102: ["city1", "city2"],
    103: ["metro1", "metro2"],
    104: ["estate1", "estate2"],
}

const building_to_texture_map = {
    "FARM": 100,
    "TOWN": 101,
    "CITY": 102,
    "METRO": 103,
    "ESTATE": 104,
}

const people_color_type = {
    HUNT: 0x033725,
    FISH: 0x0020ab,
    FARM: 0x808040,
    MORT: 0x666666,
    TRAD: 0x902090,
    WOOD: 0x654321,
    TOOL: 0x36856b,
}

// Fix texture to prevent memory leak
const people_texture = {
    HUNT: getPeopleTexture(people_color_type["HUNT"]),
    FISH: getPeopleTexture(people_color_type["FISH"]),
    FARM: getPeopleTexture(people_color_type["FARM"]),
    MORT: getPeopleTexture(people_color_type["MORT"]),
    TRAD: getPeopleTexture(people_color_type["TRAD"]),
    WOOD: getPeopleTexture(people_color_type["WOOD"]),
    TOOL: getPeopleTexture(people_color_type["TOOL"]),
}

// ---------------------------------------------------------------------------
// Get Map Sprites for background land/water
// ---------------------------------------------------------------------------

function getRandomTextureForTerrain(terrain: number): PIXI.Texture {
    let possibleTextures: Array<string> = textureMap[terrain];
    let chosenTexture: string = possibleTextures[Math.floor(Math.random() * possibleTextures.length)]
    return sheet.textures[chosenTexture];
}

function getSprite(terrain: number): PIXI.Sprite {
    let texture = PIXI.Texture.WHITE;
    if (!(terrain in textureMap)) {
        console.error("No such terrain exist");
    } else {
        texture = getRandomTextureForTerrain(terrain)
    }
    let sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.angle = [0,90,180,270][Math.floor(Math.random() * 4)];
    return sprite;
}

// ---------------------------------------------------------------------------
// Get people representing sprites, different color for types
// ---------------------------------------------------------------------------

function getPeopleTexture(color: number, radius: number = 4): PIXI.Texture {
    let ra = radius * 2 // Higher resolution
    let graphics = new PIXI.Graphics();
    graphics.beginFill(color, 0.7);
    graphics.lineStyle(1, 0xedcc9f, 0.8);
    graphics.drawCircle(ra,ra,ra);
    graphics.endFill();
    return app.renderer.generateTexture(graphics, PIXI.SCALE_MODES.LINEAR, 1);
}

function getPeopleSprite(ptype: string): PIXI.Sprite {
    // change after ptype addition.
    let texture = people_texture[ptype];
    let sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.zIndex = 100;
    sprite.buttonMode = true;
    sprite.interactive = true;
    sprite.scale.set(0.5);
    sprite
        .on('mouseover', emphasizePerson)
        .on('mouseout', unEmphasizePerson)
        .on('click', toggleLockPersonInfo);
    return sprite;
}

// ---------------------------------------------------------------------------
// Display hooks
// ---------------------------------------------------------------------------

function clear_focus_scale(person_id) {
    for (let sp of peopleSprites) {
        if (sp.name == person_id) {
            sp.scale.set(0.5);
        }
    }
}

function toggleLockPersonInfo() {
    if (focus.isFocusSet() && focus.getFocusType() == "person") {
        let person_id = focus.getFocusValue();
        if (person_id == this.name) {
            focus.removeFocus();
            return
        } else {
            clear_focus_scale(person_id);
        }
    }
    this.scale.set(1);
    WebUtil.clearDiv(siminfobox);
    WebUtil.visualizePerson(simulation, siminfobox, simulation.people[this.name]);
    focus.setFocus("person", this.name);
}

function emphasizePerson() {
    if (focus.isFocusSet()) {
        return;
    }
    this.scale.set(1);
    WebUtil.clearDiv(siminfobox);
    WebUtil.visualizePerson(simulation, siminfobox, simulation.people[this.name]);
}

function unEmphasizePerson() {
    if (focus.isFocusSet()) {
        return;
    }
    this.scale.set(0.5);
}

function displayLocationInfo() {
    if (focus.isFocusSet() && focus.getFocusType() == "person") {
        let person_id = focus.getFocusValue();
        clear_focus_scale(person_id);
    }
    let pointstr = this.name;
    focus.setFocus("location", pointstr);
    WebUtil.clearDiv(siminfobox);
    listLocationInfo(pointstr);
}

// ---------------------------------------------------------------------------
// Display utility functions that uses the existing infrastructure
// ---------------------------------------------------------------------------

function listGeneralInfo() {
    siminfobox.appendChild(WebUtil.addInfoField("# Click on person or tile to see details..", "#999"));
    // Display Market information
    WebUtil.splitLine(siminfobox);
    WebUtil.visualizeMarketCondition(siminfobox, simulation.market_conditions);
    let report = BureauOfStatistics.generate_statistic_report(Object.values(simulation.people));
    WebUtil.visualizePeopleGroup(siminfobox, report);
    siminfobox.appendChild(WebUtil.addInfoField("Civil Buildings: ", "#bb3"));
    WebUtil.objectToLines(siminfobox, simulation.get_buildings());
}

function listLocationInfo(pointstr) {
    // Display general information
    let location_info = simulation.get_location_info(pointstr);
    siminfobox.appendChild(WebUtil.addInfoField("Location: " + pointstr));
    siminfobox.appendChild(WebUtil.addInfoField("Local Production: " + (location_info["resource"] ? location_info["resource"] + ", " + location_info["count"] : "None")));
    WebUtil.splitLine(siminfobox);
    // Display building information
    if (simulation.building_by_location[pointstr]) {
        WebUtil.visualizeBuilding(siminfobox, simulation.building_by_location[pointstr]);
    }
    // Display the population.
    let population = 0;
    if (pointstr in simulation.people_by_location) {
        population = simulation.people_by_location[pointstr].length;
    }
    if (population > 0) {
        let report = BureauOfStatistics.generate_statistic_report(simulation.people_by_location[pointstr]);
        WebUtil.visualizePeopleGroup(siminfobox, report);
        for (let person of simulation.people_by_location[pointstr]) {
            WebUtil.visualizePerson(simulation, siminfobox, person, false);
        }
    }
    // Display draft information
    if ("draft" in location_info) {
        let draft_count = Object.keys(location_info["draft"]).length;
        siminfobox.appendChild(WebUtil.addInfoField(`${draft_count} people draft resources from here.`));
    }
}

// ---------------------------------------------------------------------------
// Create people sprite by extracting position from simulation and recreating
// the sprites.
// ---------------------------------------------------------------------------

function createPeopleSprite(): void {
    peopleSprites = []; // Clear people for regeneration of the whole map
    for (let [pointstr, persons] of Object.entries(simulation.get_people_for_show())) {
        let point = JSON.parse(pointstr);
        let xbase: number = point.x * SPRITE_SIZE + 4 - SPRITE_SIZE/2;
        let ybase: number = point.y * SPRITE_SIZE + 4 - SPRITE_SIZE/2;
        for (let i = 0; i < persons.length; i++) {
            if (i == 15) {
                // Leave a silver of land for clicks.
                // And not display the rest of dots.
                break;
            }
            let horz = (i % 4) * 8;
            let vert = Math.floor(i/4) * 8;
            let xreal = xbase + horz;
            let yreal = ybase + vert;
            let personSprite = getPeopleSprite(persons[i].type);
            personSprite.name = persons[i].unique_id;
            personSprite.x = xreal;
            personSprite.y = yreal;
            peopleSprites.push(personSprite);
        }
    }
}

function togglePeopleSprites(state: boolean): void {
    for (let sprite of peopleSprites) {
        sprite.visible = state;
    }
}

function createBuildingSprite(): void {
    // Clear no build areas
    for (let pointstr of Object.keys(buildingSprites)) {
        if (!(pointstr in simulation.building_by_location)) {
            delete buildingSprites[pointstr];
        }
    }
    for (let [pointstr, building] of Object.entries(simulation.building_by_location)) {
        if (pointstr in buildingSprites) {
            if (buildingSprites[pointstr].name == building.type) {
                continue;
            } else {
                // The building type changed, refresh.
                delete buildingSprites[pointstr];
            }
        }
        let point = JSON.parse(pointstr);
        let buildingSprite = getSprite(building_to_texture_map[building.type]);
        buildingSprite.name = building.type;
        if (building.type == "CITY") {
            buildingSprite.scale.set(0.625);
        }
        if (building.type == "METRO") {
            buildingSprite.scale.set(0.75);
        }
        buildingSprite.x = point.x * SPRITE_SIZE;
        buildingSprite.y = point.y * SPRITE_SIZE;
        buildingSprites[pointstr] = buildingSprite;
    }
}

// ---------------------------------------------------------------------------
// Implement main logic, regenerate whole map/ go to next turn.
// ---------------------------------------------------------------------------

function generateContainer(): void {
    simulation.generate();
    const terrainMap: number[][] = simulation.geography;
    mapContainer.removeChildren();
    for (let i = 0; i < FIXED_MAP_SIZE; i++) {
        for (let j = 0; j < FIXED_MAP_SIZE; j++) {
            let terrainSprite = getSprite(terrainMap[i][j]);
            terrainSprite.name = ResourceMap.pointToStr(i, j);
            terrainSprite.x = i * SPRITE_SIZE;
            terrainSprite.y = j * SPRITE_SIZE;
            terrainSprite.interactive = true;
            terrainSprite.buttonMode = true;
            terrainSprite.on("mousedown", displayLocationInfo);
            mapContainer.addChild(terrainSprite);
        }
    }
    // people will be persisted
    createPeopleSprite();
    for (let sp of peopleSprites) {
        mapContainer.addChild(sp);
    }
    buildingSprites = {};
    createBuildingSprite()
    mapContainer.x = SPRITE_SIZE/2;
    mapContainer.y = SPRITE_SIZE/2;
    WebUtil.startingHelp(siminfobox);
}

// Helper to focus on focus_person
function focusOnPerson(): void {
    WebUtil.clearDiv(siminfobox);
    WebUtil.visualizePerson(simulation, siminfobox, simulation.people[focus.getFocusValue()]);
    // Find the focus person, if not in sprite, then remove.
    for (let sp of peopleSprites) {
        if (sp.name == focus.getFocusValue()) {
            sp.scale.set(1);
        }
    }
}

// Helper for runContainer to manage display information
function runDisplay(): void {
    if (!people_shown) {
        togglePeopleSprites(false);
    }
    if (!focus.isFocusSet()) {
        WebUtil.clearDiv(siminfobox);
        listGeneralInfo();
    } else {
        if (focus.getFocusType() == "person") {
            if (!(focus.getFocusValue() in simulation.people)) {
                focus.removeFocus();
            } else {
                focusOnPerson();
            }
        } else if (focus.getFocusType() == "location") {
            WebUtil.clearDiv(siminfobox);
            listLocationInfo(focus.getFocusValue());
        } else {
            console.log(`No such focus exist`);
        }
    }
    yearDisplay.textContent = simulation.year.toString() + " AD"
}

function runContainer(): void {
    simulation.next_round();
    for (let xp of Object.values(buildingSprites)) {
        mapContainer.removeChild(xp);
    }
    createBuildingSprite();
    for (let xp of Object.values(buildingSprites)) {
        mapContainer.addChild(xp);
    }
    // People
    for (let sp of peopleSprites) {
        mapContainer.removeChild(sp);
    }
    createPeopleSprite();
    for (let sp of peopleSprites) {
        mapContainer.addChild(sp);
    }
    runDisplay();
    Simulation.perfstat.measure_end("DRAW", simulation);
}

export function linkFamily(person_id): void {
    if (focus.isFocusSet() && focus.getFocusType() == "person") {
        let orig = focus.getFocusValue();
        clear_focus_scale(orig);
    }
    focus.setFocus("person", person_id);
    focusOnPerson();
}

let toggleLogButton = () => {
    focus.removeFocus();
    WebUtil.clearDiv(siminfobox);
    listGeneralInfo();
};

let toggleShowButton = (() => {
    let button_pressed = true;
    return () => {
        if (button_pressed) {
            togglePeopleSprites(true);
            showButton.style.borderStyle = "inset";
            people_shown = true;
        } else {
            togglePeopleSprites(false);
            showButton.style.borderStyle = "outset";
            people_shown = false;
        }
        button_pressed = !button_pressed;
    }
})();

regenButton.addEventListener("click", () => {
    generateContainer();
});

runTurnButton.addEventListener("click", () => {
    runContainer();
});

decadeBut.addEventListener("click", () => {
    let timeOutLoop = (turns) => {
        turns += 1;
        runContainer();
        if (turns < 10) {
            setTimeout(() => {
                timeOutLoop(turns);
            }, 100);
        }
    }
    timeOutLoop(0);
});

logButton.addEventListener("click", () => {
    toggleLogButton();
});

showButton.addEventListener("click", () => {
    toggleShowButton();
});

