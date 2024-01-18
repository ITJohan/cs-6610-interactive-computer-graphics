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

const vertices = new Float32Array([
  -1, -1,
  1, -1,
  1, 1,
  -1, -1,
  1, 1,
  -1, 1,
])

const vertexBuffer = device.createBuffer({
  label: 'vertex buffer',
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
})

device.queue.writeBuffer(vertexBuffer, 0, vertices)

const vertexBufferLayout = {
  arrayStride: 8,
  attributes: [{
    format: 'float32x2',
    offset: 0,
    shaderLocation: 0
  }]
}

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
  `
})

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
pass.draw(vertices.length / 2)
pass.end()

const commandBuffer = encoder.finish()
device.queue.submit([commandBuffer])
