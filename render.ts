import * as PIXI from "pixi.js";
import * as mapUtil from "./map/mapUtil";
import { Simulation, FIXED_MAP_SIZE } from "./simulation/simulation";

const app = new PIXI.Application({
    width: 640, height: 640
});
let gamezone = document.getElementById("mapspace");
gamezone.appendChild(app.view);

// Load resources
let loader = new PIXI.Loader();
loader.add('grass1', 'assets/blocks/nature/grass1.png')
    .add('grass2', 'assets/blocks/nature/grass2.png')
    .add('grass3', 'assets/blocks/nature/grass3.png')
    .add('sand1', 'assets/blocks/nature/sand1.png')
    .add('sand2', 'assets/blocks/nature/sand2.png')
    .add('sand3', 'assets/blocks/nature/sand3.png')
    .add('shrubs1', 'assets/blocks/nature/shrubs1.png')
    .add('shrubs2', 'assets/blocks/nature/shrubs2.png')
    .add('water', 'assets/blocks/nature/water.png')
    .add('deepwater', 'assets/blocks/nature/deepwater.png')
    .add('rocks1', 'assets/blocks/nature/rocks1.png')
    .add('rocks2', 'assets/blocks/nature/rocks2.png');

loader.onError.add((error) => console.error(error));
loader.load((loader, resources) => {
    generateContainer();
});

const simulation = new Simulation();
const renderer = PIXI.autoDetectRenderer({height: 640, width: 640});
const mapContainer = new PIXI.Container();
app.stage.addChild(mapContainer);

const textureMap = {
    "-1": ["deepwater"],
    0: ["water"],
    1: ["sand1", "sand2", "sand3"],
    2: ["grass1", "grass2", "grass3"],
    3: ["shrubs1", "shrubs2"],
    4: ["rocks1", "rocks2"],
}

function getRandomTextureForTerrain(terrain: number): PIXI.Texture {
    let possibleTextures: Array<string> = textureMap[terrain];
    let chosenTexture: string = possibleTextures[Math.floor(Math.random() * possibleTextures.length)]
    return loader.resources[chosenTexture].texture;
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

function getPeopleTexture(color: number, radius: number = 4): PIXI.Texture {
    let ra = radius * 2 // Higher resolution
    let graphics = new PIXI.Graphics();
    graphics.beginFill(color, 0.4);
    graphics.lineStyle(1, 0xedcc9f, 0.8);
    graphics.drawCircle(ra,ra,ra);
    graphics.endFill();
    return app.renderer.generateTexture(graphics, PIXI.SCALE_MODES.LINEAR, 1);
}

const beginTexture = getPeopleTexture(0xff0000);

function getPeopleSprite(ptype: string): PIXI.Sprite {
    // change after ptype addition.
    let texture = beginTexture;

    let sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.zIndex = 100;
    sprite.buttonMode = true;
    sprite.interactive = true;
    sprite.scale.set(0.5)
    sprite
        .on('mouseover', emphasizePerson)
        .on('mouseout', unEmphasizePerson);
    return sprite
}

function emphasizePerson() {
    this.scale.set(1);
    listPersonAttributes(this);
}

function unEmphasizePerson() {
    this.scale.set(0.5);
}

function listPersonAttributes(context) {
    let siminfobox = document.getElementById("siminfobox");
    while (siminfobox.firstChild) { 
        siminfobox.removeChild(siminfobox.firstChild);
    }
    let pravda = document.createElement("p");
    pravda.textContent = "Name: " + context.person.name;
    pravda.className = "lead";
    siminfobox.appendChild(pravda);
}

function generateContainer(): void {
    let spriteSize = 32; // Default
    simulation.generate();
    const terrainMap: number[][] = simulation.geography;
    const mapContainer = new PIXI.Container();
    // Remove all child that currently exist
    for (let i = app.stage.children.length - 1; i >= 0; i--) {
        app.stage.removeChild(app.stage.children[i]);
    }
    // Map sprites
    app.stage.addChild(mapContainer);
    for (let i = 0; i < FIXED_MAP_SIZE; i++) {
        for (let j = 0; j < FIXED_MAP_SIZE; j++) {
            const terrainSprite = getSprite(terrainMap[i][j]);
            terrainSprite.x = i * spriteSize;
            terrainSprite.y = j * spriteSize;
            mapContainer.addChild(terrainSprite);
        }
    }
    // people
    for (let [pointstr, persons] of Object.entries(simulation.get_people_for_show())) {
        let point = JSON.parse(pointstr);
        let xbase: number = point.x * spriteSize + 4 - spriteSize/2;
        let ybase: number = point.y * spriteSize + 4 - spriteSize/2;
        for (let i = 0; i < persons.length; i++) {
            let horz = (i % 4) * 8;
            let vert = Math.floor(i/4) * 8;
            let xreal = xbase + horz;
            let yreal = ybase + vert;
            let personSprite = getPeopleSprite("HUNT");
            personSprite.name = person.name;
            personSprite.x = xreal;
            personSprite.y = yreal;
            mapContainer.addChild(personSprite);
        }
    }
    mapContainer.x = spriteSize/2;
    mapContainer.y = spriteSize/2;
}

let regenButton = document.getElementById("regen");
regenButton.addEventListener("click", () => {
    generateContainer();
});

animate();

function animate() {
    renderer.render(mapContainer);
    requestAnimationFrame(animate);
}
