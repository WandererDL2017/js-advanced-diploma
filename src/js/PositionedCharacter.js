import Character from './Character';

export default class PositionedCharacter {
  constructor(character, position) {
    if (!(character instanceof Character)) {
      throw new Error(`
        Персонаж должен быть создан с помощью класса Character или его Потомков
      `);
    }

    if (typeof position !== 'number') {
      throw new Error('Должно быть число');
    }

    this.character = character;
    this.position = position;
  }
}
