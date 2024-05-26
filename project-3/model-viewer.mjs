// @ts-check
/// <reference path="webgpu.d.ts" />

import Mat3 from './mat3.mjs';
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
  /** @type {GPUBuffer} */ #indexBuffer;
  /** @type {Uint16Array} */ #indexArray;
  /** @type {GPUBuffer} */ #uniformsBuffer;
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
    this.rotY = 0;
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
    this.#vertexArray = new Float32Array(
      Array.from(this.#model.vertexIndexToBufferDataMap.values()).flatMap((sub) => sub)
    );
    this.#vertexBuffer = this.#device.createBuffer({
      label: 'vertex buffer',
      size: this.#vertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.#device.queue.writeBuffer(this.#vertexBuffer, 0, this.#vertexArray);

    // Set up index buffer
    this.#indexArray = new Uint16Array(this.#model.indices);
    this.#indexBuffer = this.#device.createBuffer({
      label: 'index buffer',
      size: this.#indexArray.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.#device.queue.writeBuffer(this.#indexBuffer, 0, this.#indexArray);

    const shaderModule = this.#device.createShaderModule({
      label: 'shader module',
      code: `
        struct Uniforms {
          mv: mat4x4f,
          mvp: mat4x4f,
          imv: mat3x3f,
        };

        struct VertexInput {
          @location(0) position: vec4f,
          @location(1) normal: vec3f,
        };

        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) normal: vec3f,
        }

        @group(0) @binding(0) var<uniform> uniforms: Uniforms;

        @vertex
        fn vertexMain(vertexInput: VertexInput) -> VertexOutput {
          var vertexOutput: VertexOutput;
          vertexOutput.position = uniforms.mvp * vertexInput.position;
          vertexOutput.normal = vertexInput.normal;
          return vertexOutput;
        }

        @fragment
        fn fragmentMain(vertexOutput: VertexOutput) -> @location(0) vec4f {
          let normal = normalize(vertexOutput.normal);
          let lightning = normalize(vec3f(10, 0, 0));
          let color = vec3f(1, 0, 0);
          let geoTerm = clamp(dot(normal, lightning), 0, 1);
          let intensity = 0.8;
          let ambientLight = 0.15 * color;
          return vec4f(intensity * geoTerm * color + ambientLight, 1);
        }
      `,
    });

    this.#pipeline = this.#device.createRenderPipeline({
      label: 'render pipeline',
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: (3 + 3) * 4,
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3',
              },
              {
                shaderLocation: 1,
                offset: 12,
                format: 'float32x3',
              },
            ],
          },
        ],
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
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
    });

    // Set up uniforms buffer
    const uniformsBufferSize = (16 + 16 + 12) * 4;
    this.#uniformsBuffer = this.#device.createBuffer({
      label: 'uniforms buffer',
      size: uniformsBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.#bindGroup = this.#device.createBindGroup({
      label: 'uniforms bind group',
      layout: this.#pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.#uniformsBuffer },
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
    const centerZ = (this.#model.boundingBox.minZ - this.#model.boundingBox.maxZ) / 2;
    const modelMatrix = Mat4.identity().rotateX(90).translate(0, centerZ, 0).scale(15, 15, 15);
    const viewMatrix = Mat4.identity().rotateY(this.rotY).rotateX(this.rotX).translate(0, -60, this.zoom);
    const perspectiveMatrix = Mat4.identity().perspective(this.worldScale, this.worldScale);
    const orthographicProjection = Mat4.identity().orthographic(
      this.worldScale,
      -this.worldScale,
      -this.worldScale,
      this.worldScale,
      -this.worldScale,
      this.worldScale
    );
    const modelViewMatrix = Mat4.multiply(viewMatrix, modelMatrix);
    const modelViewProjectionMatrix = Mat4.multiply(
      orthographicProjection,
      Mat4.multiply(perspectiveMatrix, modelViewMatrix)
    );

    const subModelViewMatrix = new Mat3(
      modelViewMatrix.r0c0,
      modelViewMatrix.r1c0,
      modelViewMatrix.r2c0,
      modelViewMatrix.r0c1,
      modelViewMatrix.r1c1,
      modelViewMatrix.r2c1,
      modelViewMatrix.r0c2,
      modelViewMatrix.r1c2,
      modelViewMatrix.r2c2
    );

    const uniformsArray = new Float32Array([
      ...modelViewMatrix.toArray(),
      ...modelViewProjectionMatrix.toArray(),
      ...subModelViewMatrix.inverse().transpose().toArray(),
    ]);
    this.#device.queue.writeBuffer(this.#uniformsBuffer, 0, uniformsArray);

    const canvasTexture = this.#context.getCurrentTexture();

    const depthTexture = this.#device.createTexture({
      size: [canvasTexture.width, canvasTexture.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const encoder = this.#device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      label: 'render pass',
      colorAttachments: [
        {
          view: canvasTexture.createView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: [0, 0, 0, 0],
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0,
      },
    });
    pass.setPipeline(this.#pipeline);
    pass.setVertexBuffer(0, this.#vertexBuffer);
    pass.setBindGroup(0, this.#bindGroup);
    pass.setIndexBuffer(this.#indexBuffer, 'uint16');
    pass.drawIndexed(this.#indexArray.length);
    pass.end();

    const commandBuffer = encoder.finish();
    this.#device.queue.submit([commandBuffer]);
  }
}

customElements.define('model-viewer', ModelViewer);
