// @ts-check
/// <reference path="webgpu.d.ts" />

import Mat4 from './mat4.mjs';
import Model from './model.mjs';

/**
 * @typedef {{
 *  x: number;
 *  y: number;
 *  z: number;
 * }} Vertex
 */

const template = document.createElement('template');
template.innerHTML = `
  <canvas width="512" height="512"></canvas>
`;

class ModelViewer extends HTMLElement {
  static observedAttributes = ['src'];
  /** @type {HTMLCanvasElement} */ #innerCanvas;
  /** @type {Model} */ #model;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.content.cloneNode(true));
    this.#innerCanvas = /** @type {HTMLCanvasElement} */ (shadowRoot.querySelector('canvas'));
    this.#model = new Model();
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

    const context = /** @type {GPUCanvasContext} */ (
      /** @type {unknown} */
      (this.#innerCanvas.getContext('webgpu'))
    );

    if (!context) {
      throw new Error('Could not get webgpu context.');
    }

    const preferredFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format: preferredFormat,
    });

    // Set up vertex buffer
    const vertexArray = new Float32Array(this.#model.vertices);
    const vertexBuffer = device.createBuffer({
      label: 'vertex buffer',
      size: vertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertexArray);
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

    const shaderModule = device.createShaderModule({
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
      primitive: {
        topology: 'point-list',
      },
    });

    // Set up model-view-projection uniform
    const modelViewProjectionMatrix = Mat4.identity()
      .rotateX(45)
      .rotateZ(45)
      .scale(10, 10, 10)
      .translate(this.#innerCanvas.clientWidth / 2, this.#innerCanvas.clientHeight / 2, 0)
      .orthographic(0, this.#innerCanvas.clientHeight, 0, this.#innerCanvas.clientWidth, 200, -200);

    const modelViewProjectionArray = new Float32Array(modelViewProjectionMatrix.toArray());
    const mvpBufferSize = 16 * 4;

    const mvpBuffer = device.createBuffer({
      label: 'mvp buffer',
      size: mvpBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(mvpBuffer, 0, modelViewProjectionArray);

    const bindGroup = device.createBindGroup({
      label: 'mvp bind group',
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: mvpBuffer },
        },
      ],
    });

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      label: 'render pass',
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
    pass.setBindGroup(0, bindGroup);
    pass.draw(vertexArray.length / 3);
    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
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
}

customElements.define('model-viewer', ModelViewer);
