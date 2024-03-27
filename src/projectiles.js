const Events = Matter.Events
const Composite = Matter.Composite

export function enableProjectileDecay (runner, engine) {
  Events.on(runner, 'tick', () => {
    for (const body of engine.world.bodies) {
      if (body.gameType === 'projectile') {
        if (body.lifetime) {
          body.lifetime--
          if (body.lifetime <= 0) {
            Composite.remove(engine.world, body)
          }
        }
      }
    }
  })
}
