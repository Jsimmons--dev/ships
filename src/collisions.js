import { regenerateShip } from './model.js'

const Events = Matter.Events
const Body = Matter.Body
const Composite = Matter.Composite

export function addShipToProjectileCollisions (engine) {
  Events.on(engine, 'collisionStart', function (event) {
    const pairs = event.pairs
    let shipNeedsRegenerating = false
    let ship

    for (let i = 0, j = pairs.length; i !== j; ++i) {
      const pair = pairs[i]
      if ((pair.bodyA.parent.gameType === 'projectile' && pair.bodyB.parent.gameType === 'ship') || (pair.bodyB.parent.gameType === 'projectile' && pair.bodyA.parent.gameType === 'ship')) {
        let projectile
        let shipPart
        if (pair.bodyA.parent.gameType === 'ship') {
          shipPart = pair.bodyA
          ship = pair.bodyA.parent
          projectile = pair.bodyB.parent
        } else {
          shipPart = pair.bodyB
          ship = pair.bodyB.parent
          projectile = pair.bodyA.parent
        }

        const bodyAMassFactor = projectile.mass / ship.mass

        // get the distance between the contact and the center of the ship
        const collisionPoint = pair.collision.supports[0]
        const distance = Math.sqrt((collisionPoint.x - ship.position.x) ** 2 + (collisionPoint.y - ship.position.y) ** 2)
        // get the angle between the collision point and the center of the ship
        const angle = Math.atan2(collisionPoint.y - ship.position.y, collisionPoint.x - ship.position.x)

        // get the tangential velocity of the collision point
        const tangentialVelocity = Math.sqrt(projectile.velocity.x ** 2 + projectile.velocity.y ** 2) * Math.sin(angle - Math.atan2(projectile.velocity.y, projectile.velocity.x))

        Body.setAngularVelocity(ship, -tangentialVelocity * distance * (Math.PI / 180) * bodyAMassFactor)

        Body.setVelocity(ship, { x: projectile.velocity.x * bodyAMassFactor, y: projectile.velocity.y * bodyAMassFactor })

        Composite.remove(engine.world, projectile)
        if (shipPart.model.health > 0) {
          shipPart.model.health -= 20
          if (shipPart.model.health <= 0) {
            shipNeedsRegenerating = true
          }
        }
      }
    }
    if (shipNeedsRegenerating) {
      regenerateShip(ship, ship.model, engine)
    }
  })
}
