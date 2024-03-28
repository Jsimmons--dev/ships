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

export function mainRenderLoop (canvas, engine, thisLoop) {
  const loopElapsed = thisLoop - lastLoop
  lastLoop = thisLoop
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

  context.beginPath()

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
    } else if (bodies[i].gameType === 'interface-button-basic') {
      switch (bodies[i].experience) {
        case 'Destruction Simulator':
          context.drawImage(destroyButton, getAnimOffset(destroyButtonStepWidth, destroyButtonSheetLength, loopElapsed, engine.currentExperience === 'Destruction Simulator'), 0, destroyButtonStepWidth, destroyButtonSheetHeight, bodies[i].position.x - (destroyButtonStepWidth / 2), bodies[i].position.y - (destroyButtonSheetHeight / 2), destroyButtonStepWidth, destroyButtonSheetHeight)
          break
        case 'Ship Builder':
          context.drawImage(buildButton, getAnimOffset(buildButtonStepWidth, buildButtonSheetLength, loopElapsed, engine.currentExperience === 'Ship Builder'), 0, buildButtonStepWidth, buildButtonSheetHeight, bodies[i].position.x - (buildButtonStepWidth / 2), bodies[i].position.y - (buildButtonSheetHeight / 2), buildButtonStepWidth, buildButtonSheetHeight)
          break
      }
    } else {
      renderProjectile(bodies[i], context)
    }
    context.lineWidth = 1
    context.strokeStyle = 'green'
    context.fillStyle = 'green'
  }
}
