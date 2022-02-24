import Character from '../Character';

export default class Swordsman extends Character {
  constructor(...param) {
    super(...param);
    this.type = 'swordsman';
    this.attack = 40;
    this.defence = 10;
    this.moveDistance = 4;
    this.attackDistance = 1;
  }
}
