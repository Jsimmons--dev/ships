import { projectileLifetime } from './consts.js'

const Bodies = Matter.Bodies
const Body = Matter.Body
const Composite = Matter.Composite
const MouseConstraint = Matter.MouseConstraint
const Mouse = Matter.Mouse

export function createProjectileFirer (x, y, engine) {
  const projectileFirer = Bodies.circle(300, 310, 10, { mass: 100, frictionAir: 1, isSensor: true })
  projectileFirer.experienceParent = 'Destruction Simulator'
  projectileFirer.renderType = 'basic-circle'
  Composite.add(engine.world, [projectileFirer])

  const projectileRotation = Bodies.circle(100, 110, 15, { mass: 100, frictionAir: 1, isSensor: true })
  projectileRotation.experienceParent = 'Destruction Simulator'
  projectileRotation.renderType = 'basic-circle'
  Composite.add(engine.world, [projectileRotation])
  const projectileRotationCenter = Bodies.circle(100, 100, 8, { mass: 100, frictionAir: 1, isSensor: true })
  projectileRotationCenter.experienceParent = 'Destruction Simulator'
  projectileRotationCenter.renderType = 'basic-circle'
  Composite.add(engine.world, [projectileRotationCenter])

  return setInterval(() => {
    const projectile = Bodies.circle(projectileFirer.position.x, projectileFirer.position.y, 5, { mass: 10, frictionAir: 0, isSensor: true })
    projectile.lifetime = projectileLifetime
    projectile.experienceParent = 'Destruction Simulator'

    const velocity = { x: projectileRotation.position.x - projectileRotationCenter.position.x, y: projectileRotation.position.y - projectileRotationCenter.position.y }

    Body.setVelocity(projectile, velocity)
    projectile.gameType = 'projectile'
    Composite.add(engine.world, [projectile])
  }, 200)
}

export function addBasicMouseControl (canvas, engine) {
  // add mouse control
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

  Composite.add(engine.world, mouseConstraint)

  // keep the mouse in sync with rendering
}
