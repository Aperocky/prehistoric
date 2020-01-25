export type Point = {
    x: number;
    y: number;
}

type Height = {
    point: Point;
    height: number;
}

type DirectionalRecord = {
    left: boolean;
    right: boolean;
}

export class bfsMap {
    size: number;
    matrix: number[][];
    start_elevation: number;

    constructor(size: number, start: number) {
        this.size = size;
        this.start_elevation = start;
        this.matrix = [];
        this.run_bfs();
    }

    run_bfs() {
        this.matrix[0] = [];
        this.matrix[0][0] = this.start_elevation;
        let positions: Height[] = [{point: {x:0, y:0}, height: this.start_elevation}];
        let known_position: { [key: string]: DirectionalRecord } = {};
        while (true) {
            // Add next batch of positions, and fill it in.
            let next_positions: Height[] = [];
            for (let position of positions) {
                let point = position.point;
                if (point.x + 1 < this.size) {
                    let new_point: Point = {x: point.x + 1, y: point.y};
                    if (!(JSON.stringify(new_point) in known_position)) {
                        next_positions.push({point: new_point,
                            height: position.height + this.random_offset()});
                        known_position[JSON.stringify(new_point)] = {left: true, right: false};
                    } else if (!known_position[JSON.stringify(new_point)].left) {
                        next_positions.push({point: new_point,
                            height: position.height + this.random_offset()});
                        known_position[JSON.stringify(new_point)] = {left: true, right: true};
                    }
                }
                if (point.y + 1 < this.size) {
                    let new_point: Point = {x: point.x, y: point.y + 1};
                    if (!(JSON.stringify(new_point) in known_position)) {
                        next_positions.push({point: new_point,
                            height: position.height + this.random_offset()});
                        known_position[JSON.stringify(new_point)] = {left: false, right: true};
                    } else if (!known_position[JSON.stringify(new_point)].right) {
                        next_positions.push({point: new_point,
                            height: position.height + this.random_offset()});
                        known_position[JSON.stringify(new_point)] = {left: true, right: true};
                    }
                }
            }
            // Add this batch to actual map, if already exist, smooth over.
            for (let position of next_positions) {
                let point = position.point;
                if (this.matrix.length == point.x) {
                    this.matrix.push([]);
                }
                if (!this.matrix[point.x][point.y]) {
                    this.matrix[point.x][point.y] = position.height;
                } else {
                    this.matrix[point.x][point.y] =
                        (position.height + this.matrix[point.x][point.y])/2;
                }
            }
            positions = next_positions;
            if (positions.length == 0) {
                break;
            }
        }
    }

    random_offset() {
        return (Math.random() - 0.5) * 2
    }

    get_matrix() {
        return this.matrix;
    }
}

enum Terrain {
    Deep = -1,
    Water = 0,
    Barren = 1,
    Grassland = 2,
    Forest = 3,
    Mountain = 4,
}

function rotateMatrix(m: number[][]): number[][] {
    const n = m[0].length;
    let res = []
    for (let i = 0; i < n; ++i) {
        for (let j = 0; j < n; ++j) {
            if (!res[j]) { res[j] = []; }
            res[j][i] = m[n-1-i][j];
        }
    }
    return res;
}

function addMatrix(m: number[][], n: number[][]): number[][] {
    return m.map(function(col, i) {
        return col.map(function(num, j) {
            return num + n[i][j];
        });
    });
}

function multiplyBy(m: number[][], n: number): number[][] {
    return m.map(function(col) {
        return col.map(function(num) {
            return num * n;
        });
    });
}

export class TerrainMap {
    // Map generator.
    size: number;
    height: number[][];
    precip: number[][];
    map: number[][];

    constructor(size: number) {
        this.size = size;
        let multiplier = 2/size
        this.map = [];
        this.height = multiplyBy(this.getHeightMap(), multiplier);
        this.precip = multiplyBy(this.getHeightMap(this.size/4), multiplier);
        this.buildTerrainMap();
    }

    getHeightMap(start = 0) {
        let seed_height = new bfsMap(this.size, start).get_matrix();
        for (let i = 0; i < 3; i++) {
            let more_height = new bfsMap(this.size, start).get_matrix();
            for (let j = i; j < 3; j++) {
                more_height = rotateMatrix(more_height);
            }
            seed_height = addMatrix(seed_height, more_height)
        }
        return seed_height;
    }

    determineTerrain(height: number, precip: number): Terrain {
        if (height < -0.5) {
            return Terrain.Deep;
        } else if (height < 0) {
            return Terrain.Water;
        } else if (height > 1.2) {
            return Terrain.Mountain;
        } else {
            if (precip < 2) {
                return Terrain.Barren;
            } else if (precip < 2.6) {
                return Terrain.Grassland;
            } else {
                return Terrain.Forest;
            }
        }
    }

    buildTerrainMap() {
        for (let i = 0; i < this.size; i++) {
            this.map[i] = [];
            for (let j = 0; j < this.size; j++) {
                let terrain = this.determineTerrain(this.height[i][j], this.precip[i][j]);
                this.map[i][j] = terrain;
            }
        }
    }
}

