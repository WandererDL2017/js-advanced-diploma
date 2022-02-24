import Character from '../Character';

export default class Daemon extends Character {
  constructor(...param) {
    super(...param);
    this.type = 'daemon';
    this.attack = 10;
    this.defence = 40;
    this.moveDistance = 1;
    this.attackDistance = 4;
  }
}
