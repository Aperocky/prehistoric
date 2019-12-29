import * as PIXI from "pixi.js";
import * as mapUtil from "./map/mapUtil";

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

const mapContainer = new PIXI.Container();
app.stage.addChild(mapContainer);

const textureMap = {
    0: ["water"],
    1: ["sand1", "sand2", "sand3"],
    2: ["grass1", "grass2", "grass3"],
    3: ["shrubs1", "shrubs2"],
    4: ["rocks1", "rocks2"],
    5: ["deepwater"],
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

function generateContainer(size = 20): void {
    let mapsize = size;
    let spriteSize = 32; // Default
    const terrainMap: number[][] = new mapUtil.TerrainMap(mapsize).map;
    const mapContainer = new PIXI.Container();
    // Remove all child that currently exist
    for (let i = app.stage.children.length - 1; i >= 0; i--) {
        app.stage.removeChild(app.stage.children[i]);
    }
    app.stage.addChild(mapContainer);
    for (let i = 0; i < mapsize; i++) {
        for (let j = 0; j < mapsize; j++) {
            const terrainSprite = getSprite(terrainMap[i][j]);
            terrainSprite.x = i * spriteSize;
            terrainSprite.y = j * spriteSize;
            mapContainer.addChild(terrainSprite);
        }
    }
    mapContainer.x = spriteSize/2;
    mapContainer.y = spriteSize/2;
}

let regenButton = document.getElementById("regen");
regenButton.addEventListener("click", () => {
    generateContainer();
});
