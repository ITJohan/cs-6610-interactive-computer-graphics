// @ts-check

export default class Model {
  /** @type {{x: number; y: number; z: number}[]} */ vertices;
  /** @type {{x: number; y: number; z: number}[]} */ vertexNormals;
  /** @type {{x: number; y: number; z: number}[]} */ textureCoordinates;
  /** @type {{vertexIndex: number, normalIndex: number, textureIndex: number}[]} */ indices;
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

        this.vertices.push({ x, y, z });
        return;
      }

      if (line.includes('vn ')) {
        const parsedLine = line.split(' ');
        const x = Number(parsedLine[1]);
        const y = Number(parsedLine[2]);
        const z = Number(parsedLine[3]);
        this.vertexNormals.push({ x, y, z });
        return;
      }

      if (line.includes('vt ')) {
        const parsedLine = line.split(' ');
        const x = Number(parsedLine[1]);
        const y = Number(parsedLine[2]);
        const z = Number(parsedLine[3]);
        this.textureCoordinates.push({ x, y, z });
        return;
      }

      if (line.includes('f ')) {
        const parsedLine = line.split(' ');

        const [vertexIndex1, textureIndex1, normalIndex1] = parsedLine[1].split('/').map((index) => Number(index) - 1);
        const [vertexIndex2, textureIndex2, normalIndex2] = parsedLine[2].split('/').map((index) => Number(index) - 1);
        const [vertexIndex3, textureIndex3, normalIndex3] = parsedLine[3].split('/').map((index) => Number(index) - 1);
        const [vertexIndex4, textureIndex4, normalIndex4] = parsedLine[4].split('/').map((index) => Number(index) - 1);

        this.indices.push({ vertexIndex: vertexIndex1, normalIndex: normalIndex1, textureIndex: textureIndex1 });
        this.indices.push({ vertexIndex: vertexIndex2, normalIndex: normalIndex2, textureIndex: textureIndex2 });
        this.indices.push({ vertexIndex: vertexIndex3, normalIndex: normalIndex3, textureIndex: textureIndex3 });

        if (vertexIndex4 !== -1) {
          this.indices.push({ vertexIndex: vertexIndex1, normalIndex: normalIndex1, textureIndex: textureIndex1 });
          this.indices.push({ vertexIndex: vertexIndex3, normalIndex: normalIndex3, textureIndex: textureIndex3 });
          this.indices.push({ vertexIndex: vertexIndex4, normalIndex: normalIndex4, textureIndex: textureIndex4 });
        }

        return;
      }
    });
  }

  /** @returns {number[]} */
  getInterleavedVertexData() {
    /** @type {number[]} */
    const data = new Array(this.indices.length * 3);

    for (let i = 0; i < this.indices.length; i++) {
      const { vertexIndex } = this.indices[i];

      const vertexData = this.vertices[vertexIndex];

      const dataIndex = vertexIndex * 3;

      if (typeof data[dataIndex] !== 'number') {
        data[dataIndex] = vertexData.x;
        data[dataIndex + 1] = vertexData.y;
        data[dataIndex + 2] = vertexData.z;
      }
    }

    return data;
  }
}
