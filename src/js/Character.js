export default class Character {
  constructor(level, type = 'generic') {
    this.level = level;
    this.attack = 0;
    this.defence = 0;
    this.health = 50;
    this.type = type;
    // TODO: throw error if user use "new Character()"
    if (new.target === Character) {
      throw new Error('Нельзя использовать Character для создания новых персонажей');
    }
  }

  static levelUp() {
    this.level += 1;
    this.health += 80;
    if (this.health > 100) {
      this.health = 100;
    }
    this.attack = Math.max(this.attack, (this.attack, (80 + this.health)) / 100);
    this.defence = Math.max(this.defence, (this.defence * (80 + this.defence)) / 100);
  }
}
