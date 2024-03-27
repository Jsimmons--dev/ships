import { generateShipCells, generateShipBody } from './src/model.js'
import { mainRenderLoop } from './src/rendering.js'
import { defaultShipSize } from './src/consts.js'
import { addBasicMouseControl, createProjectileFirer } from './src/tools.js'
import { addShipToProjectileCollisions } from './src/collisions.js'
import { enableProjectileDecay } from './src/projectiles.js'

// module aliases
const Engine = Matter.Engine
const Render = Matter.Render
const Runner = Matter.Runner
const Composite = Matter.Composite

// create an engine
const engine = Engine.create({
  gravity: { scale: 0 }
})

const render = Render.create({
  element: document.body,
  engine,
  options: {
    width: 800,
    height: 600
  }
})
// create the wireframe default renderer for debugging
Render.run(render)

// create the initial ship
const shipCellModel = {
  width: defaultShipSize,
  height: defaultShipSize,
  cells:
        generateShipCells(defaultShipSize, defaultShipSize)
}

const ship = generateShipBody(shipCellModel, { x: 400, y: 285 })
Composite.add(engine.world, [ship])

const runner = Runner.create()
Runner.run(runner, engine)

// create the canvas element for rendering
const canvas = document.createElement('canvas')
canvas.width = 800
canvas.height = 600
document.body.appendChild(canvas)

// add a tool that fires a constant projectile
createProjectileFirer(300, 310, engine)

// add basic mouse grab, note that this only applies to wireframe render
addBasicMouseControl(render, engine)

// enable ship to projectile collisions
addShipToProjectileCollisions(engine)

enableProjectileDecay(runner, engine)

// start the rendering process
mainRenderLoop(canvas, engine)
