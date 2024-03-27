const Composite = Matter.Composite

const shipImage = new Image(20, 20)
shipImage.src = 'assets/IndustrialTile_73.png'

const shipTileDamagedImage = new Image(20, 20)
shipTileDamagedImage.src = 'assets/tile_damaged.png'

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

export function mainRenderLoop (canvas, engine) {
  const context = canvas.getContext('2d')
  const bodies = Composite.allBodies(engine.world)

  window.requestAnimationFrame(() => mainRenderLoop(canvas, engine))

  context.fillStyle = 'grey'
  context.fillRect(0, 0, canvas.width, canvas.height)

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
    } else {
      renderProjectile(bodies[i], context)
    }
    context.lineWidth = 1
    context.strokeStyle = 'green'
    context.fillStyle = 'green'
  }
}
