import Projectile from './Projectile';

class BounceProjectile extends Projectile {
  constructor(sourceID = null) {
    super(sourceID);
    this.maxBounces = 1;
  }
}

export default BounceProjectile;