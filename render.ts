import * as PIXI from "pixi.js";
import * as WebUtil from "./webutil/webutil";
import { Simulation, FIXED_MAP_SIZE } from "./simulation/simulation";
import { ResourceMap } from "./map/informationMap";
// Buttons
const logButton = document.getElementById("logbut");

const SPRITE_SIZE = 32;
const app = new PIXI.Application({
    width: 640, height: 640
});
let gamezone = document.getElementById("mapspace");
gamezone.appendChild(app.view);

// ---------------------------------------------------------------------------
// Load resources for map, initiate persisting variables
// ---------------------------------------------------------------------------

let loader = new PIXI.Loader();
loader.add("assets/blocks/packed/groundt_texture.json");
let sheet;

loader.onError.add((error) => console.error(error));
loader.load((loader) => {
    sheet = loader.resources["assets/blocks/packed/groundt_texture.json"].spritesheet;
    generateContainer();
});

const simulation = new Simulation();
const mapContainer = new PIXI.Container();
app.stage.addChild(mapContainer);
const siminfobox = document.getElementById("siminfobox");

// Stateful variables that need to exist outside functions
let peopleSprites: PIXI.Sprite[];

const textureMap = {
    "-1": ["deepwater"],
    0: ["water"],
    1: ["sand1", "sand2", "sand3"],
    2: ["grass1", "grass2", "grass3"],
    3: ["shrubs1", "shrubs2"],
    4: ["rocks1", "rocks2"],
}

const display_type = {
    HUNT: "gatherer",
    FARM: "farmer",
    FISH: "fisher",
    MORT: "RIP",
}

const people_color_type = {
    HUNT: 0x023220,
    FISH: 0x005e5e,
    FARM: 0x909050,
    MORT: 0x666666,
}

// Fix texture to prevent memory leak
const people_texture = {
    HUNT: getPeopleTexture(people_color_type["HUNT"]),
    FISH: getPeopleTexture(people_color_type["FISH"]),
    FARM: getPeopleTexture(people_color_type["FARM"]),
    MORT: getPeopleTexture(people_color_type["MORT"]),
}

// ---------------------------------------------------------------------------
// Get Map Sprites for background land/water
// ---------------------------------------------------------------------------

function getRandomTextureForTerrain(terrain: number): PIXI.Texture {
    let possibleTextures: Array<string> = textureMap[terrain];
    let chosenTexture: string = possibleTextures[Math.floor(Math.random() * possibleTextures.length)]
    // return loader.resources[chosenTexture].texture;
    return sheet.textures[chosenTexture + ".png"];
}

function getSprite(terrain: number, size = 32): PIXI.Sprite {
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
        .on('mouseout', unEmphasizePerson);
    return sprite;
}

function emphasizePerson() {
    this.scale.set(1);
    listPersonAttributes(this);
}

function unEmphasizePerson() {
    this.scale.set(0.5);
    listGeneralInfo();
}

// ---------------------------------------------------------------------------
// Display utility functions that uses the existing infrastructure
// ---------------------------------------------------------------------------

function listGeneralInfo() {
    WebUtil.clearDiv(siminfobox);
    siminfobox.appendChild(WebUtil.addInfoField("# Click on person to see details..", "#999"));
    siminfobox.appendChild(WebUtil.addInfoField("YEAR: " + (4500 - simulation.year) + " BC"));
    siminfobox.appendChild(WebUtil.addInfoField("TOTAL POPULATION: " + Object.keys(simulation.people).length));
    siminfobox.appendChild(WebUtil.addInfoField("TOTAL PRODUCTION: " + JSON.stringify(simulation.get_gdp())));
    siminfobox.appendChild(WebUtil.addInfoField("TOTAL STORAGE: " + JSON.stringify(simulation.get_wealth())));
    siminfobox.appendChild(WebUtil.addInfoField("COMPOSITION: " + JSON.stringify(simulation.get_composition())));
}

function listPersonAttributes(context) {
    WebUtil.clearDiv(siminfobox);
    siminfobox.appendChild(WebUtil.addInfoField("Name: " + simulation.people[context.name].name));
    siminfobox.appendChild(WebUtil.addInfoField("Occupation: " + display_type[simulation.people[context.name].type]));
    siminfobox.appendChild(WebUtil.addInfoField("Age: " + simulation.people[context.name].age));
    siminfobox.appendChild(WebUtil.addInfoField("Income: " + JSON.stringify(simulation.people[context.name].income)));
    siminfobox.appendChild(WebUtil.addInfoField("Storage: " + JSON.stringify(simulation.people[context.name].store)));
}

function displayLocationInfo() {
    console.log(this);
    WebUtil.clearDiv(siminfobox);
    let pointstr = this.name;
    let location_info = simulation.get_location_info(pointstr);
    siminfobox.appendChild(WebUtil.addInfoField("Location: " + pointstr));
    siminfobox.appendChild(WebUtil.addInfoField("Resource: " + location_info["resource"]));
    siminfobox.appendChild(WebUtil.addInfoField("Production: " + location_info["count"]));
    siminfobox.appendChild(WebUtil.addInfoField("Draft: "));
    for (let [pid, draft] of Object.entries(location_info["draft"])) {
        let person_name = simulation.people[pid].name;
        siminfobox.appendChild(WebUtil.addInfoField(person_name + ": " + draft));
    }
}

//let displayLocationToggler = (() => {
//    let toggler_status = false;
//    return (context) => {
//        if (toggler_status) {
//            listGeneralInfo();
//        } else {
//            console.log(context);
//            displayLocationInfo(context);
//        }
//        toggler_status = !toggler_status;
//    }
//})();

function listSimulationLogs() {
    WebUtil.clearDiv(siminfobox);
    for (let i = simulation.log_queue.length-1; i >= 0; i--) {
        siminfobox.appendChild(WebUtil.addInfoField(simulation.log_queue[i]));
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
    mapContainer.x = SPRITE_SIZE/2;
    mapContainer.y = SPRITE_SIZE/2;
    WebUtil.startingHelp(siminfobox);
}

function runContainer(): void {
    simulation.next_round();
    // Remove old sprites
    for (let sp of peopleSprites) {
        mapContainer.removeChild(sp);
    }
    createPeopleSprite();
    for (let sp of peopleSprites) {
        mapContainer.addChild(sp);
    }
    listGeneralInfo();
}

let toggleLogButton = (() => {
    let button_pressed = false;
    return () => {
        if (button_pressed) {
            listGeneralInfo();
            logButton.style.borderStyle = "outset";
        } else {
            listSimulationLogs();
            logButton.style.borderStyle = "inset";
        }
        button_pressed = !button_pressed;
    }
})();

let regenButton = document.getElementById("regen");
regenButton.addEventListener("click", () => {
    generateContainer();
});

let runTurnButton = document.getElementById("maketurn");
runTurnButton.addEventListener("click", () => {
    runContainer();
});

logButton.addEventListener("click", () => {
    toggleLogButton();
});
