// @ts-check

export default class Model {
  /** @type {[number, number, number][]} */ vertices;
  /** @type {[number, number, number][]} */ vertexNormals;
  /** @type {[number, number, number][]} */ textureCoordinates;
  /** @type {Map<string, [number, number, number, number, number, number]>} */ vertexIndexToBufferDataMap;
  /** @type {number[]} */ indices;
  /**
   * @type {{
   * minX: number;
   * maxX: number;
   * minY: number;
   * maxY: number;
   * minZ: number;
   * maxZ: number;
   * }}
   */ boundingBox;

  constructor() {
    this.vertices = [];
    this.vertexNormals = [];
    this.textureCoordinates = [];
    this.indices = [];
    this.vertexIndexToBufferDataMap = new Map()
    this.boundingBox = {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      minZ: 0,
      maxZ: 0,
    };
  }

  async load(/** @type {string} */ src) {
    const result = await fetch(src);
    const text = await result.text();
    const lines = text.split('\r\n');

    lines.forEach((line) => {
      if (line.startsWith('#') || line === '') return;

      if (line.includes('v ')) {
        const parsedLine = line.split(' ');
        const x = Number(parsedLine[2]);
        const y = Number(parsedLine[3]);
        const z = Number(parsedLine[4]);

        if (x < this.boundingBox.minX) {
          this.boundingBox.minX = x;
        }
        if (x > this.boundingBox.maxX) {
          this.boundingBox.maxX = x;
        }
        if (y < this.boundingBox.minY) {
          this.boundingBox.minY = y;
        }
        if (y > this.boundingBox.maxY) {
          this.boundingBox.maxY = y;
        }
        if (z < this.boundingBox.minZ) {
          this.boundingBox.minZ = z;
        }
        if (z > this.boundingBox.maxZ) {
          this.boundingBox.maxZ = z;
        }

        this.vertices.push([ x, y, z ]);
        return;
      }

      if (line.includes('vn ')) {
        const parsedLine = line.split(' ');
        const x = Number(parsedLine[1]);
        const y = Number(parsedLine[2]);
        const z = Number(parsedLine[3]);
        this.vertexNormals.push([ x, y, z ]);
        return;
      }

      if (line.includes('vt ')) {
        const parsedLine = line.split(' ');
        const x = Number(parsedLine[1]);
        const y = Number(parsedLine[2]);
        const z = Number(parsedLine[3]);
        this.textureCoordinates.push([ x, y, z ]);
        return;
      }

      if (line.includes('f ')) {
        const parsedLine = line.split(' ');

        parsedLine.forEach((key, keyIndex) => {
          if (key === '' || keyIndex === 0) return;
          
          if (this.vertexIndexToBufferDataMap.has(key) === false) {
            const [vertexIndex, textureIndex, normalIndex] = key.split('/').map((index) => Number(index) - 1);
            
            const vertexData = this.vertices[vertexIndex]
            const normalData = this.vertexNormals[normalIndex]
            
            this.vertexIndexToBufferDataMap.set(key, [...vertexData, ...normalData])
          }
          
          let vertexIndex = 0;

          for (const [mapKey] of this.vertexIndexToBufferDataMap) {
            if (mapKey === key) {
              if (keyIndex === 4) {
                this.indices.push(this.indices[this.indices.length - 3], this.indices[this.indices.length - 1], vertexIndex)
              } else {
                this.indices.push(vertexIndex)
              }
            }

            vertexIndex++;
          }
        })

        return;
      }
    });
  }
}
