import GM from '../event/GameManager';
import Rectangle from '../util/Rectangle';
import Explosion from './Explosion';
import WM from './WorldManager';
import { isClient } from '../util/util';
import AM from '../audio/AudioManager';
import Shotgun from './Shotgun';
import Vector from '../util/Vector';
import Hero from '../entity/Hero';
import PickUp from './PickUp';

class ShotgunPickUp extends PickUp {
  onPickUp(hero) {
    hero.setWeapon('Shotgun');
  }
}

export default ShotgunPickUp;