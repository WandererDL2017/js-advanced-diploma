import Character from '../Character';

export default class Magician extends Character {
  constructor(...param) {
    super(...param);
    this.type = 'magician';
    this.attack = 10;
    this.defence = 40;
    this.moveDistance = 1;
    this.attackDistance = 4;
  }
}
