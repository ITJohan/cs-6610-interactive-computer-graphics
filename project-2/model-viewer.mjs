// @ts-check
/// <reference path="webgpu.d.ts" />

import Mat4 from './mat4.mjs';
import Model from './model.mjs';

const template = document.createElement('template');
template.innerHTML = `
  <canvas width="512" height="512"></canvas>
`;

class ModelViewer extends HTMLElement {
  static observedAttributes = ['src'];

  /** @type {GPUDevice} */ #device;
  /** @type {GPUCanvasContext} */ #context;
  /** @type {GPURenderPipeline} */ #pipeline;
  /** @type {GPUBuffer} */ #vertexBuffer;
  /** @type {Float32Array} */ #vertexArray;
  /** @type {GPUBuffer} */ #mvpBuffer;
  /** @type {GPUBindGroup} */ #bindGroup;
  /** @type {HTMLCanvasElement} */ #innerCanvas;
  /** @type {Model} */ #model;
  /** @type {number} */ worldScale;
  /** @type {number} */ zoom;
  /** @type {boolean} */ mousePressed;
  /** @type {number} */ rotX;
  /** @type {number} */ rotY;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.content.cloneNode(true));
    this.#innerCanvas = /** @type {HTMLCanvasElement} */ (shadowRoot.querySelector('canvas'));
    this.#model = new Model();
    this.zoom = 500;
    this.rotX = 0;
    this.rotY = -140;
    this.worldScale = this.#innerCanvas.clientWidth;
  }

  async connectedCallback() {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported.');
    }

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      throw new Error('No adapter available.');
    }

    this.#device = await adapter.requestDevice();

    this.#context = /** @type {GPUCanvasContext} */ (
      /** @type {unknown} */
      (this.#innerCanvas.getContext('webgpu'))
    );

    if (!this.#context) {
      throw new Error('Could not get webgpu context.');
    }

    const preferredFormat = navigator.gpu.getPreferredCanvasFormat();
    this.#context.configure({
      device: this.#device,
      format: preferredFormat,
    });

    // Set up vertex buffer
    this.#vertexArray = new Float32Array(this.#model.vertices);
    this.#vertexBuffer = this.#device.createBuffer({
      label: 'vertex buffer',
      size: this.#vertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.#device.queue.writeBuffer(this.#vertexBuffer, 0, this.#vertexArray);
    /** @type {GPUVertexBufferLayout} */ const vertexBufferLayout = {
      arrayStride: 3 * 4,
      attributes: [
        {
          format: 'float32x3',
          offset: 0,
          shaderLocation: 0,
        },
      ],
    };

    const shaderModule = this.#device.createShaderModule({
      label: 'shader module',
      code: `
        @group(0) @binding(0) var<uniform> mvp : mat4x4<f32>;

        @vertex
        fn vertexMain(@location(0) pos: vec3f) -> @builtin(position) vec4f {
          return mvp * vec4f(pos, 1);
        }

        @fragment
        fn fragmentMain() -> @location(0) vec4f {
          return vec4f(1, 1, 1, 1);
        }
      `,
    });

    this.#pipeline = this.#device.createRenderPipeline({
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
      primitive: {
        topology: 'point-list',
      },
    });

    const mvpBufferSize = 16 * 4;
    this.#mvpBuffer = this.#device.createBuffer({
      label: 'mvp buffer',
      size: mvpBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.#bindGroup = this.#device.createBindGroup({
      label: 'mvp bind group',
      layout: this.#pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.#mvpBuffer },
        },
      ],
    });

    this.render();

    this.#innerCanvas.addEventListener('wheel', (e) => {
      this.zoom += e.deltaY;

      this.render();
    });
    this.#innerCanvas.addEventListener('mousedown', () => (this.mousePressed = true));
    this.#innerCanvas.addEventListener('mouseup', () => (this.mousePressed = false));
    this.#innerCanvas.addEventListener('mousemove', (e) => {
      if (!this.mousePressed) return;

      this.rotX += e.movementY;
      this.rotY += e.movementX;

      this.render();
    });
  }

  async attributeChangedCallback(name, prev, next) {
    if (prev === next) {
      return;
    }

    switch (name) {
      case 'src':
        this.setAttribute('src', next);
        this[name] = next;
        await this.#model.load(next);
    }
  }

  render() {
    const modelMatrix = Mat4.identity().scale(15, 15, 15);
    const viewMatrix = Mat4.identity().rotateX(this.rotX).rotateY(this.rotY).translate(0, 0, this.zoom);
    const perspectiveMatrix = Mat4.identity().perspective(-this.worldScale, this.worldScale);
    const orthographicProjection = Mat4.identity().orthographic(
      this.worldScale,
      -this.worldScale,
      -this.worldScale,
      this.worldScale,
      -this.worldScale,
      this.worldScale
    );
    const projectionMatrix = Mat4.multiply(
      orthographicProjection,
      Mat4.multiply(perspectiveMatrix, Mat4.multiply(viewMatrix, modelMatrix))
    );

    const projectionMatrixArray = new Float32Array(projectionMatrix.toArray());
    this.#device.queue.writeBuffer(this.#mvpBuffer, 0, projectionMatrixArray);

    const encoder = this.#device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      label: 'render pass',
      colorAttachments: [
        {
          view: this.#context.getCurrentTexture().createView(),
          loadOp: 'clear',
          clearValue: [0, 0, 0, 0],
          storeOp: 'store',
        },
      ],
    });
    pass.setPipeline(this.#pipeline);
    pass.setVertexBuffer(0, this.#vertexBuffer);
    pass.setBindGroup(0, this.#bindGroup);
    pass.draw(this.#vertexArray.length / 3);
    pass.end();

    const commandBuffer = encoder.finish();
    this.#device.queue.submit([commandBuffer]);
  }
}

customElements.define('model-viewer', ModelViewer);
