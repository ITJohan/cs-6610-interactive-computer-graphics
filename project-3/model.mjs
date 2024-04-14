// @ts-check

export default class Model {
  /** @type {number[]} */ vertices;
  /** @type {number[]} */ vertexNormals;
  /** @type {number[]} */ textureCoordinates;
  /** @type {[number, number, number][]} */ triangles;
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
    this.triangles = [];
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

        const vertex1 = parsedLine[1].split('/');
        const vertex2 = parsedLine[2].split('/');
        const vertex3 = parsedLine[3].split('/');
        const vertex4 = parsedLine[4].split('/');

        this.triangles.push(
          [Number(vertex1[0]), Number(vertex1[1]), Number(vertex1[2])],
          [Number(vertex2[0]), Number(vertex2[1]), Number(vertex2[2])],
          [Number(vertex3[0]), Number(vertex3[1]), Number(vertex3[2])],
          [Number(vertex4[0]), Number(vertex4[1]), Number(vertex4[2])]
        );

        return;
      }
    });
  }
}
