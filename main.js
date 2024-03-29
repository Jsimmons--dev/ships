import { generateShipCells, generateShipBody, addDestructionSimulatorInterface } from './src/model.js'
import { mainRenderLoop } from './src/rendering.js'
import { canvasHeight, canvasWidth, defaultShipSize, cellSize, maxShipSize } from './src/consts.js'
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

const experienceHandlers = {
  'Destruction Simulator': {
  },
  'Ship Builder': {
  }

}
// create an engine
const engine = Engine.create({
  gravity: { scale: 0 }
})

engine.currentExperience = 'Ship Builder'
engine.experienceState = {}

const runner = Runner.create()
Runner.run(runner, engine)

const shipCellModel = {
  width: defaultShipSize,
  height: defaultShipSize,
  cells:
    generateShipCells(defaultShipSize, defaultShipSize)
}
// clone the model for the blueprint
const shipBlueprint = JSON.parse(JSON.stringify(shipCellModel))
shipBlueprint.shipSpaceOffset = { x: 0, y: 0 }
engine.shipBlueprint = shipBlueprint

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
    // clone the blueprint
    const shipCellModel = JSON.parse(JSON.stringify(engine.shipBlueprint))
    const ship = generateShipBody(shipCellModel, { x: 400, y: 285 }, experience)
    Composite.add(engine.world, [ship])

    // add a tool that fires a constant projectile
    const projectileCreatorInterval = createProjectileFirer(300, 310, engine)
    experienceIntervals[experience].projectileCreatorInterval = projectileCreatorInterval
  } else if (experience === 'Ship Builder') {
    // add ship builder interface

    // load current ship blueprint into space
    const ship = generateShipBody(engine.shipBlueprint, { x: 0, y: 0 }, experience)
    Composite.add(engine.world, [ship])
    // add parts adder handlers and add handlers to map
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

const addPartToShipBlueprint = debounceClick((location) => {
  if (location.x >= 0 && location.x < engine.shipBlueprint.width && location.y >= 0 && location.y < engine.shipBlueprint.height) {
    engine.shipBlueprint.cells[location.y][location.x] = { health: 100, gridTag: location.y + ',' + location.x }
  } else {
    // make a new array with the new cell that is large enough to include the new location
    const newCells = []
    const newMaxSize = Math.max(engine.shipBlueprint.width, location.x, engine.shipBlueprint.height, location.y) + 1
    for (let i = 0; i < newMaxSize; i++) {
      newCells.push([])
      for (let j = 0; j < newMaxSize; j++) {
        newCells[i][j] = (engine.shipBlueprint.cells[i] && engine.shipBlueprint.cells[i][j]) || { health: 0, gridTag: i + ',' + j }
      }
    }
    newCells[location.y][location.x] = { health: 100, gridTag: location.y + ',' + location.x }
    engine.shipBlueprint.cells = newCells
    engine.shipBlueprint.width = newMaxSize
    engine.shipBlueprint.height = newMaxSize
    const ship = Composite.allBodies(engine.world).find(body => body.gameType === 'ship')
    Composite.remove(engine.world, ship)
    const newShipCellModel = JSON.parse(JSON.stringify(engine.shipBlueprint))
    const newShip = generateShipBody(newShipCellModel, { x: 0, y: 0 }, engine.currentExperience)
    Composite.add(engine.world, [newShip])
  }
}, 50)

loadExperience(engine.currentExperience)
Events.on(runner, 'tick', () => {
  if (mouseConstraint?.body?.gameType === 'interface-button-basic') {
    clickInterface(mouseConstraint.body.experience)
  }
  // determine which shipSpace cell the mouse is in
  if (engine.currentExperience === 'Ship Builder') {
    // check if mouse is between widthOffset and heightOffset box
    const widthOffset = canvas.width / 2 - (maxShipSize * cellSize / 2)
    const heightOffset = canvas.height / 2 - (maxShipSize * cellSize / 2)

    if (mouse.position.x > widthOffset && mouse.position.x < widthOffset + maxShipSize * cellSize && mouse.position.y > heightOffset && mouse.position.y < heightOffset + maxShipSize * cellSize) {
      engine.experienceState.mouseShipSpaceCell = {
        x: Math.floor((mouse.position.x - widthOffset) / cellSize),
        y: Math.floor((mouse.position.y - heightOffset) / cellSize)
      }
    } else {
      engine.experienceState.mouseShipSpaceCell = null
    }
    if (engine.experienceState.mouseShipSpaceCell) {
      // check if the mouse over over a ship part
      const mouseShipSpaceCell = engine.experienceState.mouseShipSpaceCell
      const ship = Composite.allBodies(engine.world).find(body => body.gameType === 'ship')
      const shipModel = ship.model
      if (mouseConstraint.mouse.button === 0) {
        // if mouse is down, add a new part to the ship
        if (!(shipModel.cells[mouseShipSpaceCell.y] && shipModel.cells[mouseShipSpaceCell.y][mouseShipSpaceCell.x] && shipModel.cells[mouseShipSpaceCell.y][mouseShipSpaceCell.x].health > 0)) {
          // check if the mouse is over an empty space that is adjacent to a ship part
          const adjacentCells = [
            { x: mouseShipSpaceCell.x + 1, y: mouseShipSpaceCell.y },
            { x: mouseShipSpaceCell.x - 1, y: mouseShipSpaceCell.y },
            { x: mouseShipSpaceCell.x, y: mouseShipSpaceCell.y + 1 },
            { x: mouseShipSpaceCell.x, y: mouseShipSpaceCell.y - 1 }
          ]
          const adjacentCell = adjacentCells.find(cell => shipModel.cells[cell.y] && shipModel.cells[cell.y][cell.x] && shipModel.cells[cell.y][cell.x].health > 0)
          if (adjacentCell) {
            addPartToShipBlueprint(mouseShipSpaceCell)
          }
        }
      }
    }
  }
})
