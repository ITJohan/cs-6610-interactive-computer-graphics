// @ts-check

export default class Model {
  /** @type {number[]} */ vertices;
  /** @type {number[]} */ vertexNormals;
  /** @type {number[]} */ textureCoordinates;
  /** @type {[number, number, number][]} */ triangles;

  constructor() {
    this.vertices = [];
    this.vertexNormals = [];
    this.textureCoordinates = [];
    this.triangles = [];
  }

  async load(/** @type {string} */ src) {
    const result = await fetch(src);
    const text = await result.text();
    const lines = text.split('\r\n');

    lines.map((line) => {
      if (line.includes('v ')) {
        const parsedLine = line.split(' ');
        this.vertices.concat(Number(parsedLine[2]), Number(parsedLine[3]), Number(parsedLine[4]));
      }

      if (line.includes('vn ')) {
        const parsedLine = line.split(' ');
        this.vertexNormals.concat(Number(parsedLine[1]), Number(parsedLine[2]), Number(parsedLine[3]));
      }

      if (line.includes('vt ')) {
        const parsedLine = line.split(' ');
        this.textureCoordinates.concat(Number(parsedLine[1]), Number(parsedLine[2]), Number(parsedLine[3]));
      }

      if (line.includes('f ')) {
        const parsedLine = line.split(' ');

        const vertex1 = parsedLine[1].split('/');
        const vertex2 = parsedLine[2].split('/');
        const vertex3 = parsedLine[3].split('/');
        const vertex4 = parsedLine[4].split('/');

        this.triangles.concat(
          [Number(vertex1[0]), Number(vertex1[1]), Number(vertex1[2])],
          [Number(vertex2[0]), Number(vertex2[1]), Number(vertex2[2])],
          [Number(vertex3[0]), Number(vertex3[1]), Number(vertex3[2])],
          [Number(vertex4[0]), Number(vertex4[1]), Number(vertex4[2])]
        );
      }
    });
  }
}
