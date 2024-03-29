import { cellSize, maxShipSize } from './consts.js'
const Composite = Matter.Composite

const shipImage = new Image(20, 20)
shipImage.src = 'assets/IndustrialTile_73.png'

const shipTileDamagedImage = new Image(20, 20)
shipTileDamagedImage.src = 'assets/tile_damaged.png'

const buildButtonSheetLength = 2489
const buildButtonStepWidth = 131
const buildButtonSheetHeight = 66
const buildButton = new Image(buildButtonSheetLength, buildButtonSheetHeight)
buildButton.src = 'assets/sprites/Build_DropDownButton-Sheet.png'

const destroyButtonSheetLength = 1572
const destroyButtonStepWidth = 131
const destroyButtonSheetHeight = 66
const destroyButton = new Image(destroyButtonSheetLength, destroyButtonSheetHeight)
destroyButton.src = 'assets/sprites/Destroy_DropDownButton-Sheet.png'

const starBackgroundWidth = 500
const starBackgroundHeight = 700
const starBackground = new Image(starBackgroundWidth, starBackgroundHeight)
starBackground.src = 'assets/backgrounds/stars.jpg'

export function renderProjectile (projectileBody, context) {
  const vertices = projectileBody.vertices
  context.beginPath()
  context.moveTo(vertices[0].x, vertices[0].y)
  context.shadowBlur = 3
  context.strokeStyle = '#32CD32'
  context.fillStyle = '#32CD32'
  context.shadowColor = '#32CD32'

  for (let j = 1; j < vertices.length; j += 1) {
    context.lineTo(vertices[j].x, vertices[j].y)
  }

  context.lineTo(vertices[0].x, vertices[0].y)
  context.closePath()
  context.stroke()
  context.fill()
  context.shadowBlur = 0
  context.shadowColor = 'rgba(0,0,0,0)'
}

let animationState = 0
const animationDuration = 1000
function getAnimOffset (frameWidth, totalSheetWidth, animationProgression, isPlaying) {
  const animSteps = totalSheetWidth / frameWidth
  animationState += animSteps * (animationProgression / animationDuration)

  return isPlaying ? Math.floor(animationState % animSteps) * frameWidth : 0
}

let lastLoop = document.timeline.currentTime

export function renderShip (canvas, engine) {
  const context = canvas.getContext('2d')
  const widthOffset = canvas.width / 2 - (maxShipSize * cellSize / 2)
  const heightOffset = canvas.height / 2 - (maxShipSize * cellSize / 2)
  // use the ship cell model from engine.shipBlueprint to render the ship
  const shipCellModel = engine.shipBlueprint
  for (let i = 0; i < shipCellModel.height; i++) {
    for (let j = 0; j < shipCellModel.width; j++) {
      if (shipCellModel.cells[i][j].health > 0) {
        context.translate((j * cellSize + widthOffset), (i * cellSize + heightOffset))
        context.drawImage(shipImage, 0, 0, 20, 20)
        context.translate(-(j * cellSize + widthOffset), -(i * cellSize + heightOffset))
      }
    }
  }
}

// start to refactor experience specific logic for rendering
export function renderShipBuilderExperience (canvas, engine) {
  // render a grid representing 50x50 cells
  const context = canvas.getContext('2d')
  context.beginPath()
  context.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  context.lineWidth = 1
  const widthOffset = canvas.width / 2 - (maxShipSize * cellSize / 2)
  const heightOffset = canvas.height / 2 - (maxShipSize * cellSize / 2)
  for (let i = 0; i < maxShipSize; i += 1) {
    context.moveTo(i * cellSize + widthOffset, 0 + heightOffset)
    context.lineTo(i * cellSize + widthOffset, cellSize * maxShipSize + heightOffset)
    context.moveTo(0 + widthOffset, i * cellSize + heightOffset)
    context.lineTo(cellSize * maxShipSize + widthOffset, i * cellSize + heightOffset)
  }
  context.stroke()
  context.closePath()

  context.beginPath()
  context.strokeStyle = 'rgba(0, 0, 255, 0.9)'
  context.lineWidth = 2
  context.moveTo(widthOffset, canvas.height / 2)
  context.lineTo(widthOffset + cellSize * maxShipSize, canvas.height / 2)
  context.moveTo(canvas.width / 2, heightOffset)
  context.lineTo(canvas.width / 2, heightOffset + cellSize * maxShipSize)
  context.stroke()

  context.beginPath()
  context.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  context.lineWidth = 2
  context.moveTo(widthOffset, heightOffset)
  context.lineTo(widthOffset + cellSize * maxShipSize, heightOffset)
  context.lineTo(widthOffset + cellSize * maxShipSize, heightOffset + cellSize * maxShipSize)
  context.lineTo(widthOffset, heightOffset + cellSize * maxShipSize)
  context.lineTo(widthOffset, heightOffset)
  context.stroke()
  context.closePath()

  if (engine.experienceState.mouseShipSpaceCell) {
    context.beginPath()
    context.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    context.lineWidth = 2
    context.moveTo(widthOffset + engine.experienceState.mouseShipSpaceCell.x * cellSize, heightOffset + engine.experienceState.mouseShipSpaceCell.y * cellSize)
    context.lineTo(widthOffset + engine.experienceState.mouseShipSpaceCell.x * cellSize + cellSize, heightOffset + engine.experienceState.mouseShipSpaceCell.y * cellSize)
    context.lineTo(widthOffset + engine.experienceState.mouseShipSpaceCell.x * cellSize + cellSize, heightOffset + engine.experienceState.mouseShipSpaceCell.y * cellSize + cellSize)
    context.lineTo(widthOffset + engine.experienceState.mouseShipSpaceCell.x * cellSize, heightOffset + engine.experienceState.mouseShipSpaceCell.y * cellSize + cellSize)
    context.lineTo(widthOffset + engine.experienceState.mouseShipSpaceCell.x * cellSize, heightOffset + engine.experienceState.mouseShipSpaceCell.y * cellSize)
    context.stroke()
    context.closePath()
    // also draw a ship cell at the mouse position
    context.translate((engine.experienceState.mouseShipSpaceCell.x * cellSize + widthOffset), (engine.experienceState.mouseShipSpaceCell.y * cellSize + heightOffset))
    context.drawImage(shipImage, 0, 0, 20, 20)
    context.translate(-(engine.experienceState.mouseShipSpaceCell.x * cellSize + widthOffset), -(engine.experienceState.mouseShipSpaceCell.y * cellSize + heightOffset))
  }

  // draw a blue line down the vertical center and horizontal center
  renderShip(canvas, engine)
}

export function mainRenderLoop (canvas, engine, timestamp) {
  const loopElapsed = timestamp - lastLoop
  lastLoop = timestamp
  const context = canvas.getContext('2d')
  const bodies = Composite.allBodies(engine.world)

  window.requestAnimationFrame((timestamp) => mainRenderLoop(canvas, engine, timestamp))

  switch (engine.currentExperience) {
    case 'Destruction Simulator':
      context.fillStyle = 'grey'
      context.fillRect(0, 0, canvas.width, canvas.height)
      // draw the image but preserve the aspect ratio  by stretching the height when drawing to canvas
      context.drawImage(starBackground, 0, 0, starBackgroundWidth, starBackgroundHeight, 0, 0, canvas.width, canvas.height * (starBackgroundHeight / starBackgroundWidth))
      context.globalCompositeOperation = 'saturation'
      context.fillStyle = 'hsl(0, 100%, 8%)'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.globalCompositeOperation = 'source-over'
      context.fillStyle = 'rgba(180, 18, 0, 0.1)'
      context.fillRect(0, 0, canvas.width, canvas.height)
      break
    case 'Ship Builder':
      context.fillStyle = 'grey'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(starBackground, 0, 0, starBackgroundWidth, starBackgroundHeight, 0, 0, canvas.width, canvas.height * (starBackgroundHeight / starBackgroundWidth))
      context.globalCompositeOperation = 'saturation'
      context.fillStyle = 'hsl(0, 100%, 8%)'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.globalCompositeOperation = 'source-over'
      context.fillStyle = 'rgba(10, 100, 0, 0.1)'
      context.fillRect(0, 0, canvas.width, canvas.height)
      break
  }

  if (engine.currentExperience === 'Ship Builder') {
    renderShipBuilderExperience(canvas, engine)
  }

  context.beginPath()
  if (engine.currentExperience === 'Destruction Simulator') {
    for (let i = 0; i < bodies.length; i += 1) {
      if (bodies[i].gameType === 'ship') {
        for (let j = 1; j < bodies[i].parts.length; j += 1) {
          const vertices = bodies[i].parts[j].vertices
          const shipPart = bodies[i].parts[j]
          context.translate((vertices[0].x), (vertices[0].y))
          const angle = Math.atan2(vertices[1].y - vertices[0].y, vertices[1].x - vertices[0].x)
          context.rotate(angle)
          if (shipPart.model.health > 50) {
            context.drawImage(shipImage, 0, 0, 20, 20)
          } else {
            context.drawImage(shipTileDamagedImage, 0, 0, 20, 20)
          }
          context.rotate(-angle)
          context.translate(-(vertices[0].x), -(vertices[0].y))
        }
      }
    }
  }
  for (let i = 0; i < bodies.length; i += 1) {
    if (bodies[i].gameType === 'interface-button-basic') {
      switch (bodies[i].experience) {
        case 'Destruction Simulator':
          context.drawImage(destroyButton, getAnimOffset(destroyButtonStepWidth, destroyButtonSheetLength, loopElapsed, engine.currentExperience === 'Destruction Simulator'), 0, destroyButtonStepWidth, destroyButtonSheetHeight, bodies[i].position.x - (destroyButtonStepWidth / 2), bodies[i].position.y - (destroyButtonSheetHeight / 2), destroyButtonStepWidth, destroyButtonSheetHeight)
          break
        case 'Ship Builder':
          context.drawImage(buildButton, getAnimOffset(buildButtonStepWidth, buildButtonSheetLength, loopElapsed, engine.currentExperience === 'Ship Builder'), 0, buildButtonStepWidth, buildButtonSheetHeight, bodies[i].position.x - (buildButtonStepWidth / 2), bodies[i].position.y - (buildButtonSheetHeight / 2), buildButtonStepWidth, buildButtonSheetHeight)
          break
      }
    } else if (bodies[i].gameType === 'projectile') {
      renderProjectile(bodies[i], context)
    } else if (bodies[i].renderType === 'basic-circle') {
      renderProjectile(bodies[i], context)
    }
  }
  context.lineWidth = 1
  context.strokeStyle = 'green'
  context.fillStyle = 'green'
}
