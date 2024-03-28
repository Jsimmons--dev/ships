import { generateShipCells, generateShipBody, addDestructionSimulatorInterface } from './src/model.js'
import { mainRenderLoop } from './src/rendering.js'
import { canvasHeight, canvasWidth, defaultShipSize } from './src/consts.js'
import { addBasicMouseControl, createProjectileFirer } from './src/tools.js'
import { addShipToProjectileCollisions } from './src/collisions.js'
import { enableProjectileDecay } from './src/projectiles.js'

// module aliases
const Engine = Matter.Engine
const Runner = Matter.Runner
const Composite = Matter.Composite
const Events = Matter.Events
const Mouse = Matter.Mouse
const MouseConstraint = Matter.MouseConstraint

const experienceIntervals = {
  'Destruction Simulator': {},
  'Ship Builder': {}
}
// create an engine
const engine = Engine.create({
  gravity: { scale: 0 }
})

engine.currentExperience = 'Destruction Simulator'

const runner = Runner.create()
Runner.run(runner, engine)

// create the canvas element for rendering
const canvas = document.createElement('canvas')
canvas.style.position = 'absolute'
canvas.style.top = '0'
canvas.style.left = '0'
canvas.width = canvasWidth
canvas.height = canvasHeight
document.body.appendChild(canvas)

// add basic mouse grab
addBasicMouseControl(canvas, engine)

// enable ship to projectile collisions
addShipToProjectileCollisions(engine)

enableProjectileDecay(runner, engine)

addDestructionSimulatorInterface(engine)

// start the rendering process
const zero = document.timeline.currentTime
mainRenderLoop(canvas, engine, zero)

const mouse = Mouse.create(canvas)
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visible: false
    }
  }
})

// create a debounce function that will only allow a function to be called once and then wait for a certain amount of time before allowing it to be called again.
// It should pass all args
function debounceClick (func, wait) {
  let timeout
  return function (...args) {
    const context = this
    const later = function () {
      timeout = null
      func.apply(context, args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function unloadExperience (experience) {
  for (const interval of Object.values(experienceIntervals[experience])) {
    clearInterval(interval)
  }
  for (const body of Composite.allBodies(engine.world)) {
    if (body.experienceParent === experience) {
      Composite.remove(engine.world, body)
    }
  }
}

function loadExperience (experience) {
  if (experience === 'Destruction Simulator') {
    // create the initial ship
    const shipCellModel = {
      width: defaultShipSize,
      height: defaultShipSize,
      cells:
    generateShipCells(defaultShipSize, defaultShipSize)
    }

    const ship = generateShipBody(shipCellModel, { x: 400, y: 285 })
    Composite.add(engine.world, [ship])

    // add a tool that fires a constant projectile
    const projectileCreatorInterval = createProjectileFirer(300, 310, engine)
    experienceIntervals[experience].projectileCreatorInterval = projectileCreatorInterval
  }
}

const clickInterface = debounceClick((experience) => {
  if (engine.currentExperience !== experience) {
    unloadExperience(engine.currentExperience)
    engine.currentExperience = experience
    loadExperience(engine.currentExperience)
    console.log('set the experience to', experience)
  }
}, 50)

loadExperience(engine.currentExperience)
Events.on(runner, 'tick', () => {
  if (mouseConstraint?.body?.gameType === 'interface-button-basic') {
    clickInterface(mouseConstraint.body.experience)
  }
})
