const fileReader = new FileReader();
fileReader.addEventListener('load', (e) => {
  const text = e.target.result;
  const lines = text.split('\r\n');

  const parsedModel = lines.reduce(
    (result, line) => {
      if (line.includes('v ')) {
        return {
          ...result,
          vertices: [...result.vertices, line],
        };
      }

      if (line.includes('vn ')) {
        return {
          ...result,
          vertexNormals: [...result.vertexNormals, line],
        };
      }

      if (line.includes('vt ')) {
        return {
          ...result,
          textureCoordinates: [...result.textureCoordinates, line],
        };
      }

      if (line.includes('f ')) {
        return {
          ...result,
          triangles: [...result.triangles, line],
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
