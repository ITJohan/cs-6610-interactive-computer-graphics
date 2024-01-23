const template = document.createElement('template');
template.innerHTML = `
  <canvas width="512" height="512"></canvas>
`;

class ModelViewer extends HTMLElement {
  static observedAttributes = ['src'];

  async #parseModel(src) {
    const result = await fetch(src);
    const text = await result.text();
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
      {
        vertices: [],
        vertexNormals: [],
        textureCoordinates: [],
        triangles: [],
      }
    );

    console.log(parsedModel);
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.innerCanvas = this.shadowRoot.querySelector('canvas');
  }

  async connectedCallback() {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported.');
    }

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      throw new Error('No adapter available.');
    }

    const device = await adapter.requestDevice();

    const context = this.innerCanvas.getContext('webgpu');
    const preferredFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format: preferredFormat,
    });

    const vertexArray = new Float32Array([
      -1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
    ]);
    const vertexBuffer = device.createBuffer({
      label: 'vertex buffer',
      size: vertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertexArray);
    const vertexBufferLayout = {
      arrayStride: 8,
      attributes: [
        {
          format: 'float32x2',
          offset: 0,
          shaderLocation: 0,
        },
      ],
    };

    const shaderModule = device.createShaderModule({
      label: 'shader module',
      code: `
        @vertex
        fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
          return vec4f(pos, 0, 1);
        }

        @fragment
        fn fragmentMain() -> @location(0) vec4f {
          return vec4f(0, 1, 0, 1);
        }
      `,
    });

    const pipeline = device.createRenderPipeline({
      label: 'render pipeline',
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [
          {
            format: preferredFormat,
          },
        ],
      },
    });

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: 'clear',
          clearValue: [0, 0, 0, 0],
          storeOp: 'store',
        },
      ],
    });
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(vertexArray.length / 2);
    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
  }

  attributeChangedCallback(name, prev, next) {
    if (prev === next) {
      return;
    }

    switch (name) {
      case 'src':
        this.setAttribute('src', next);
        this[name] = next;
        this.#parseModel(next);
    }
  }
}

customElements.define('model-viewer', ModelViewer);
