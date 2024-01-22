const fileReader = new FileReader();
fileReader.addEventListener('load', (e) => {
  const text = e.target.result;
  const lines = text.split('\r\n');

  const parsedModel = lines.reduce(
    (result, line) => {
      if (line.includes('v ')) {
        const parsedLine = line.split(' ');

        return {
          ...result,
          vertices: [
            ...result.vertices,
            {
              x: Number(parsedLine[2]),
              y: Number(parsedLine[3]),
              z: Number(parsedLine[4]),
            },
          ],
        };
      }

      if (line.includes('vn ')) {
        const parsedLine = line.split(' ');

        return {
          ...result,
          vertexNormals: [
            ...result.vertexNormals,
            {
              x: Number(parsedLine[1]),
              y: Number(parsedLine[2]),
              z: Number(parsedLine[3]),
            },
          ],
        };
      }

      if (line.includes('vt ')) {
        const parsedLine = line.split(' ');

        return {
          ...result,
          textureCoordinates: [
            ...result.textureCoordinates,
            {
              x: Number(parsedLine[1]),
              y: Number(parsedLine[2]),
              z: Number(parsedLine[3]),
            },
          ],
        };
      }

      if (line.includes('f ')) {
        const parsedLine = line.split(' ');

        const vertex1 = parsedLine[1].split('/');
        const vertex2 = parsedLine[2].split('/');
        const vertex3 = parsedLine[3].split('/');
        const vertex4 = parsedLine[4].split('/');

        return {
          ...result,
          triangles: [
            ...result.triangles,
            {
              vertex1: {
                x: Number(vertex1[0]),
                y: Number(vertex1[1]),
                z: Number(vertex1[2]),
              },
              vertex2: {
                x: Number(vertex2[0]),
                y: Number(vertex2[1]),
                z: Number(vertex2[2]),
              },
              vertex3: {
                x: Number(vertex3[0]),
                y: Number(vertex3[1]),
                z: Number(vertex3[2]),
              },
              vertex4: {
                x: Number(vertex4[0]),
                y: Number(vertex4[1]),
                z: Number(vertex4[2]),
              },
            },
          ],
        };
      }

      return result;
    },
    { vertices: [], vertexNormals: [], textureCoordinates: [], triangles: [] }
  );

  console.log(parsedModel);
});

const inputEl = document.querySelector('input');
inputEl.addEventListener('change', (e) =>
  fileReader.readAsText(e.target.files[0])
);