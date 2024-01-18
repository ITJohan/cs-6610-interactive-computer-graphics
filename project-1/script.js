// Initializations
if (!navigator.gpu) {
  throw new Error('WebGPU not supported.');
}

const adapter = await navigator.gpu.requestAdapter()

if (!adapter) {
  throw new Error('No adapter was found.')
}

const device = await adapter.requestDevice()

const canvas = document.querySelector('canvas')
const context = canvas.getContext('webgpu')
const preferredFormat = navigator.gpu.getPreferredCanvasFormat()
context.configure({
  device,
  format: preferredFormat
})

// Vertex buffer setup
const vertexArray = new Float32Array([
  -1, -1,
  1, -1,
  1, 1,
  -1, -1,
  1, 1,
  -1, 1,
])

const vertexBuffer = device.createBuffer({
  label: 'vertex buffer',
  size: vertexArray.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
})

device.queue.writeBuffer(vertexBuffer, 0, vertexArray)

const vertexBufferLayout = {
  arrayStride: 8,
  attributes: [{
    format: 'float32x2',
    offset: 0,
    shaderLocation: 0
  }]
}

// Color uniform buffer setup
const colorArray = new Float32Array([1, 0, 0, 1]);
const colorBuffer = device.createBuffer({
  label: 'color buffer',
  size: colorArray.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
})
device.queue.writeBuffer(colorBuffer, 0, colorArray)

// Shader setup
const shaderModule = device.createShaderModule({
  label: 'shader module',
  code: `
    @group(0) @binding(0) var<uniform> color: vec4f;
    @vertex
    fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
      return vec4f(pos, 0, 1);
    }

    @fragment
    fn fragmentMain() -> @location(0) vec4f {
      return color;
    }
  `
})

// Pipeline setup
const pipeline = device.createRenderPipeline({
  label: 'pipeline',
  layout: 'auto',
  vertex: {
    module: shaderModule,
    entryPoint: 'vertexMain',
    buffers: [vertexBufferLayout]
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fragmentMain',
    targets: [{
      format: preferredFormat
    }]
  }
})

// Bind group
const bindGroup = device.createBindGroup({
  label: 'bind group',
  layout: pipeline.getBindGroupLayout(0),
  entries: [{
    binding: 0,
    resource: { buffer: colorBuffer }
  }]
})

let count = 0;

function render() {
  // Update color buffer
  const red = Math.sin(count)
  count += 0.01;
  const newColorArray = new Float32Array([red, 0, 0, 1])
  device.queue.writeBuffer(colorBuffer, 0, newColorArray)

  // Encode commands and render
  const encoder = device.createCommandEncoder()
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      clearValue: [0, 0, 0, 0],
      storeOp: 'store'
    }]
  })
  pass.setPipeline(pipeline)
  pass.setVertexBuffer(0, vertexBuffer)
  pass.setBindGroup(0, bindGroup)
  pass.draw(vertexArray.length / 2)
  pass.end()

  const commandBuffer = encoder.finish()
  device.queue.submit([commandBuffer])

  requestAnimationFrame(render)
}

render();
