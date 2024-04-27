// @ts-check

export default class Model {
  /** @type {number[]} */ vertices;
  /** @type {number[]} */ vertexNormals;
  /** @type {number[]} */ textureCoordinates;
  /** @type {{vertexIndices: number[], normalIndices: number[], textureIndices: number[]}} */ faces;
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
    this.faces = { vertexIndices: [], normalIndices: [], textureIndices: [] };
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

        this.vertices.push(x, y, z);
        return;
      }

      if (line.includes('vn ')) {
        const parsedLine = line.split(' ');
        this.vertexNormals.push(Number(parsedLine[1]), Number(parsedLine[2]), Number(parsedLine[3]));
        return;
      }

      if (line.includes('vt ')) {
        const parsedLine = line.split(' ');
        this.textureCoordinates.push(Number(parsedLine[1]), Number(parsedLine[2]), Number(parsedLine[3]));
        return;
      }

      if (line.includes('f ')) {
        const parsedLine = line.split(' ');

        const [vertexIndex1, textureIndex1, normalIndex1] = parsedLine[1].split('/').map((index) => Number(index) - 1);
        const [vertexIndex2, textureIndex2, normalIndex2] = parsedLine[2].split('/').map((index) => Number(index) - 1);
        const [vertexIndex3, textureIndex3, normalIndex3] = parsedLine[3].split('/').map((index) => Number(index) - 1);
        const [vertexIndex4, textureIndex4, normalIndex4] = parsedLine[4].split('/').map((index) => Number(index) - 1);

        this.faces.vertexIndices.push(
          vertexIndex1,
          vertexIndex2,
          vertexIndex3,
          vertexIndex1,
          vertexIndex3,
          vertexIndex4
        );
        this.faces.textureIndices.push(
          textureIndex1,
          textureIndex2,
          textureIndex3,
          textureIndex1,
          textureIndex3,
          textureIndex4
        );
        this.faces.normalIndices.push(
          normalIndex1,
          normalIndex2,
          normalIndex3,
          normalIndex1,
          normalIndex3,
          normalIndex4
        );

        return;
      }
    });
  }
}
