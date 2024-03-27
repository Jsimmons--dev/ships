import { plateMass, cellSize, defaultShipSize } from './consts.js'

const Composite = Matter.Composite
const Bodies = Matter.Bodies
const Body = Matter.Body

export function generateShipCell () {
  return {
    health: 100
  }
}

export function generateShipCells (width, height) {
  const cells = []
  for (let i = 0; i < height; i++) {
    const row = []
    for (let j = 0; j < width; j++) {
      row.push(generateShipCell())
    }
    cells.push(row)
  }
  return cells
}

export function generateShipCellsFromAdjacencyGraph (width, height, adjacencyGraph) {
  const cells = []
  for (let i = 0; i < height; i++) {
    const row = []
    for (let j = 0; j < width; j++) {
      if (adjacencyGraph.has(i + ',' + j)) {
        row.push(generateShipCell())
      } else {
        row.push({ health: 0 })
      }
    }
    cells.push(row)
  }
  return {
    width,
    height,
    cells
  }
}

export function generateShipBody (shipCellModel, position) {
  const shipBody = Body.create({
    id: 'ship',
    label: 'ship',
    showAngleIndicator: true,
    showCollisions: true,
    showVelocity: true,
    frictionAir: 0.1
  })
  shipBody.gameType = 'ship'
  shipBody.model = shipCellModel

  const parts = []
  let numLiveCells = 0
  for (let i = 0; i < shipCellModel.height; i++) {
    for (let j = 0; j < shipCellModel.width; j++) {
      if (shipCellModel.cells[i][j].health > 0) {
        numLiveCells++
        const box = Bodies.rectangle(j * cellSize + position.x, i * cellSize + position.y, cellSize, cellSize)
        Body.setMass(box, plateMass)
        box.model = shipCellModel.cells[i][j]
        shipCellModel.cells[i][j].gridTag = i + ',' + j
        box.gameType = 'ship-part'
        parts.push(box)
      }
    }
  }
  const shipCenterOfGravityOffset = shipBody.position
  Body.setParts(shipBody, parts)
  Body.setMass(shipBody, numLiveCells * plateMass)
  shipBody.shipCenterOfGravityOffset = [shipBody.position.x - shipCenterOfGravityOffset.x, shipBody.position.y - shipCenterOfGravityOffset.y]
  return shipBody
}

// generated by AI, not validated yet
export function getShipIntegrity (shipCellModel) {
  // a ship is intact if every cell is adjacent to another cell
  // walk through each cell
  // build an adjacency graph for each cell
  // if a cell is not adjacent to an already visited cell, create a new adjacency graph
  // if a cell is adjacent to multiple adjacency graphs, merge them
  // if there is only one adjacency graph, the ship is intact
  // if there are multiple adjacency graphs, the ship is broken
  const adjacencyGraphs = []
  for (let i = 0; i < shipCellModel.height; i++) {
    for (let j = 0; j < shipCellModel.width; j++) {
      if (shipCellModel.cells[i][j].health > 0) {
        const cellKey = i + ',' + j
        // check if this cell is adjacent to any cell in an existing adjacency graph
        // create the keys for the 4 adjacent spaces
        const leftKey = i + ',' + (j - 1)
        const rightKey = i + ',' + (j + 1)
        const upKey = (i - 1) + ',' + j
        const downKey = (i + 1) + ',' + j
        // check if any of the keys are in an adjacency graph
        if (adjacencyGraphs.length === 0) {
          adjacencyGraphs.push(new Set([cellKey]))
          continue
        }
        let found = false
        for (const adjacencyGraph of adjacencyGraphs) {
          if (adjacencyGraph.has(leftKey) || adjacencyGraph.has(rightKey) || adjacencyGraph.has(upKey) || adjacencyGraph.has(downKey)) {
            found = true
            adjacencyGraph.add(cellKey)
          }
        }
        if (!found) {
          adjacencyGraphs.push(new Set([cellKey]))
        }
      }
    }
  }
  // merge all graphs with a point in common
  let merged = true
  while (merged) {
    merged = false
    for (let i = 0; i < adjacencyGraphs.length; i++) {
      for (let j = i + 1; j < adjacencyGraphs.length; j++) {
        const intersection = [...adjacencyGraphs[i]].filter(x => adjacencyGraphs[j].has(x))
        if (intersection.length > 0) {
          adjacencyGraphs[i] = new Set([...adjacencyGraphs[i], ...adjacencyGraphs[j]])
          adjacencyGraphs.splice(j, 1)
          merged = true
          break
        }
      }
      if (merged) {
        break
      }
    }
  }

  return adjacencyGraphs
}

export function regenerateShip (oldShipBody, shipCellModel, engine) {
  const adjacencyGraphs = getShipIntegrity(shipCellModel)

  const velocity = oldShipBody.velocity
  const angularVelocity = oldShipBody.angularVelocity

  for (const newShipCellModel of adjacencyGraphs.map(graph => generateShipCellsFromAdjacencyGraph(defaultShipSize, defaultShipSize, graph))) {
    const shipBody = Body.create({
      id: 'ship',
      label: 'ship',
      showAngleIndicator: true,
      showCollisions: true,
      showVelocity: true,
      frictionAir: 0.1
    })
    shipBody.gameType = 'ship'
    shipBody.model = newShipCellModel

    const parts = []
    let numLiveCells = 0
    for (let i = 0; i < newShipCellModel.height; i++) {
      for (let j = 0; j < newShipCellModel.width; j++) {
        if (newShipCellModel.cells[i][j].health > 0) {
          numLiveCells++
          // const box = Bodies.rectangle(j * cellSize, i * cellSize, cellSize, cellSize);
          const oldCell = oldShipBody.parts.find(part => part.model.gridTag === i + ',' + j)
          // make a new body out of the old vertices
          const box = Body.create({
            id: 'ship-part',
            label: 'ship-part',
            vertices: oldCell.vertices,
            position: { x: oldCell.position.x, y: oldCell.position.y }
          })
          Body.setMass(box, plateMass)
          box.model = newShipCellModel.cells[i][j]
          newShipCellModel.cells[i][j].gridTag = i + ',' + j
          box.gameType = 'ship-part'
          parts.push(box)
        }
      }
    }
    Body.setParts(shipBody, parts)
    Body.setMass(shipBody, numLiveCells * plateMass)
    Body.setVelocity(shipBody, velocity)
    Body.setAngularVelocity(shipBody, angularVelocity)
    Composite.add(engine.world, shipBody)
  }
  Composite.remove(engine.world, oldShipBody)
}