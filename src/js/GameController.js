import themes from './themes';
import cursors from './cursors';
import { generateTeam } from './generators';
import GamePlay from './GamePlay';
import GameState from './GameState';
import PositionedCharacter from './PositionedCharacter';
import Bowman from './heroes/Bowman';
import Magician from './heroes/Magician';
import Swordsman from './heroes/Swordsman';
import Undead from './heroes/Undead';
import Vampire from './heroes/Vampire';
import Daemon from './heroes/Daemon';
import Character from './Character';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.arrayClassGamer = [Bowman, Magician, Swordsman];
    this.arrayClassEnemy = [Undead, Vampire, Daemon];
    this.randomGamer = [0, 1, 8, 9, 16, 17, 24, 25, 32, 33, 40, 41, 48, 49, 56, 57];
    this.randomEnemy = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];
    this.position = [];
    this.teamEnemy = {};
    this.teamGamer = {};
    this.click = -1;
    this.enter = -1;
    this.characterClick = {};
    this.characterEnter = {};
    this.characterMove = [];
    this.characterAttack = [];
    this.left = [0, 8, 16, 24, 32, 40, 48, 56];
    this.right = [7, 15, 23, 31, 39, 47, 55, 63];
    this.level = 1;
    this.scores = 0;
    this.player = {};
  }

  init() {
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    this.gamePlay.drawUi(themes.prairie);
    this.gamePlay.redrawPositions(this.generateGamer(this.randomGamer, this.arrayClassGamer));
    this.gamePlay.redrawPositions(this.generateGamer(this.randomEnemy, this.arrayClassEnemy));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));
  }

  onNewGameClick() {
    this.position = [];
    this.gamePlay.drawUi(themes.prairie);
    this.gamePlay.redrawPositions(this.generateGamer(this.randomGamer, this.arrayClassGamer));
    this.gamePlay.redrawPositions(this.generateGamer(this.randomEnemy, this.arrayClassEnemy));
    this.level = 1;
    this.scores = 0;
    this.teamEnemy = [];
    this.teamGamer = [];
    this.click = -1;
    this.enter = -1;
    this.player = 1;
  }

  onSaveGameClick() {
    const saved = {
      position: this.position,
      player: this.player,
      level: this.level,
      scores: this.scores,
    };
    this.stateService.save(GameState.from(saved));
    GamePlay.showMessage('Игра сохранена');
  }

  onLoadGameClick() {
    const load = this.stateService.load();
    if (load) {
      this.position = load.position;
      this.player = load.player;
      this.level = load.level;
      this.scores = load.scores;
    }
    // eslint-disable-next-line default-case
    switch (load.level) {
      case 1:
        this.gamePlay.drawUi('prairie');
        break;
      case 2:
        this.gamePlay.drawUi('desert');
        break;
      case 3:
        this.gamePlay.drawUi('arctic');
        break;
      case 4:
        this.gamePlay.drawUi('mountain');
        break;
    }
    this.gamePlay.redrawPositions(this.position);
  }

  randomPosition(random) {
    let number = random[Math.floor(Math.random() * random.length)];
    while (this.checkPosition(number)) {
      number = random[Math.floor(Math.random() * random.length)];
    }
    return number;
  }

  generateGamer(characterRandom, arrayCharacter) {
    const team = generateTeam(arrayCharacter, 1, 2);
    for (const character of team) {
      this.position.push(new PositionedCharacter(character, this.randomPosition(characterRandom)));
    }
    return this.position;
  }

  checkPosition(number) {
    for (const pos of this.position) {
      if (number === pos.position) {
        return true;
      }
    }
    return false;
  }

  onCellClick(index) {
    // TODO: react to click
    if (this.click !== -1) {
      this.gamePlay.deselectCell(this.click);
    }

    if (this.position.find((pos) => pos.position === index)) {
      const click = this.position.find((pos) => pos.position === index);

      if (click.character['type'] === 'magician' || click.character['type'] === 'bowman' || click.character['type'] === 'swordsman') {
        this.characterClick = click;
        this.gamePlay.selectCell(index);
        this.click = index;
      }

      if (click.character['type'] === 'undead' || click.character['type'] === 'daemon' || click.character['type'] === 'vampire') {
        this.clickEnemy(index, click);
        this.player = 1;
      }
    } else {
      this.standAhother(index);
    }
  }

  standAhother(index) {
    this.position.forEach((pos) => {
      // eslint-disable-next-line max-len
      if (pos.position === this.characterClick.position && this.characterMove.indexOf(index) !== -1) {
        // eslint-disable-next-line no-param-reassign
        pos.position = index;
        this.gamePlay.redrawPositions(this.position);
        this.computerRunning();
      }
    });
  }

  clickEnemy(index, click) {
    this.player = 0;
    if (this.characterAttack.indexOf(index) !== -1 && this.click !== -1) {
      // eslint-disable-next-line max-len
      const damageHealth = Math.max(this.characterClick.character.attack - click.character.defence, this.characterClick.character.attack * 0.1);
      const damage = this.gamePlay.showDamage(index, damageHealth);
      damage.then((response) => {
        // eslint-disable-next-line no-param-reassign
        click.character.health -= damageHealth;
        if (click.character.health < 0) {
          this.position = this.position.filter((item) => item !== click);
        }
        this.gamePlay.redrawPositions(this.position);
        this.computerRunning();
        response();
      }, (err) => {
        throw new Error(err);
      });
    } else {
      GamePlay.showError('Вы пытаетесь выбрать персонажа врага. Выберите своего персонажа!');
    }
  }

  computerRunning() {
    this.gamePlay.deselectCell(this.click);
    this.click = -1;

    this.showWin();

    let attackGamer;

    const gamerActiveAttack = this.teamEnemy.find((item) => {
      this.characterAttack = this.makeAttack(item);
      // eslint-disable-next-line max-len
      attackGamer = this.teamGamer.find((value) => this.characterAttack.indexOf(value.position) !== -1);
      return attackGamer;
    });

    if (gamerActiveAttack) {
      this.gamePlay.selectCell(gamerActiveAttack.position);
      // eslint-disable-next-line max-len
      const damageHealth = Math.max(gamerActiveAttack.character.attack - attackGamer.character.defence, gamerActiveAttack.character.attack * 0.1);
      const damage = this.gamePlay.showDamage(attackGamer.position, damageHealth);
      damage.then((response) => {
        attackGamer.character.health -= damageHealth;
        if (attackGamer.character.health < 0) {
          this.position = this.position.filter((item) => item !== attackGamer);
          this.showWin();
        }

        this.gamePlay.deselectCell(gamerActiveAttack.position);
        this.gamePlay.redrawPositions(this.position);
        response();
      }, (err) => {
        throw new Error(err);
      });
    } else {
      // eslint-disable-next-line max-len
      const active = this.teamEnemy[Math.floor(Math.random() * Math.floor(this.teamEnemy.length))];
      this.characterMove = this.makeMove(active);
      const pos = this.randomPosition(this.characterMove);
      this.gamePlay.deselectCell(active.position);
      active.position = pos;
      this.gamePlay.redrawPositions(this.position);
    }
  }

  showWin() {
    this.teamEnemy = this.position.filter((item) => item.character.type === 'undead' || item.character.type === 'daemon' || item.character.type === 'vampire');
    this.teamGamer = this.position.filter((item) => item.character.type === 'bowman' || item.character.type === 'magician' || item.character.type === 'swordsman');
    if (this.teamEnemy.length === 0) {
      this.level += 1;

      for (const char of this.teamGamer) {
        this.scores += char.character.health;
      }
      for (const char of this.teamGamer) {
        char.position = this.randomPosition(this.randomGamer);
      }

      this.teamGamer.forEach((elem) => Character.levelUp.call(elem.character));

      this.showNewLevel(this.teamGamer);
    }
    if (this.teamGamer.length === 0) {
      this.gamePlay.cellEnterListeners = [];
      this.gamePlay.cellLeaveListeners = [];
      this.gamePlay.cellClickListeners = [];
      GamePlay.showMessage('Вы проиграли...');
    }
  }

  showNewLevel(gamer) {
    if (this.level === 2) {
      this.gamePlay.drawUi(themes.desert);
      this.newLevelUp(1, 2, 1, gamer.length + 1);
      this.gamePlay.redrawPositions(this.position);
    }
    if (this.level === 3) {
      this.gamePlay.drawUi(themes.arctic);
      this.newLevelUp(2, 3, 2, gamer.length + 2);
      this.gamePlay.redrawPositions(this.position);
    }
    if (this.level === 4) {
      this.gamePlay.drawUi(themes.mountain);
      this.newLevelUp(3, 4, 2, gamer.length + 2);
      this.gamePlay.redrawPositions(this.position);
    }
    if (this.level === 5) {
      this.gamePlay.cellEnterListeners = [];
      this.gamePlay.cellLeaveListeners = [];
      this.gamePlay.cellClickListeners = [];
      GamePlay.showMessage(`
        Победили!
        Количество набранных баллов: ${this.scores}`);
    }
  }

  newLevelUp(levelGamer, levelEnemy, countGamer, countEnemy) {
    const teamGamer = generateTeam(this.arrayClassGamer, countGamer, levelGamer);

    for (const character of teamGamer) {
      this.position.push(new PositionedCharacter(character, this.randomPosition(this.randomGamer)));
    }

    const teamEnemy = generateTeam(this.arrayClassEnemy, levelEnemy, countEnemy);

    for (const character of teamEnemy) {
      this.position.push(new PositionedCharacter(character, this.randomPosition(this.randomEnemy)));
    }
  }

  move(step, gamer) {
    let arr = [];
    const buffer = 8;
    for (let i = 1; i <= step; i += 1) {
      arr.push(gamer + buffer * i);
      arr.push(gamer - buffer * i);
    }
    // left
    for (let i = 1; i <= step; i += 1) {
      if (this.left.indexOf(gamer) !== -1) {
        break;
      }

      arr.push(gamer - i);
      arr.push(gamer - ((buffer + 1) * i));
      arr.push(gamer + ((buffer - 1) * i));
      if (this.left.indexOf(gamer - i) !== -1) {
        break;
      }
    }
    // right
    for (let i = 1; i <= step; i += 1) {
      if (this.right.indexOf(gamer) !== -1) {
        break;
      }

      arr.push(gamer + i);
      arr.push(gamer - ((buffer - 1) * i));
      arr.push(gamer + ((buffer + 1) * i));
      if (this.right.indexOf(gamer + i) !== -1) {
        break;
      }
    }

    arr = arr.filter((item) => item >= 0 && item <= 63);
    return arr;
  }

  // eslint-disable-next-line consistent-return
  makeMove(gamer) {
    const { character } = gamer;
    if (character.type === 'swordsman' || character.type === 'undead') {
      return this.move(4, gamer.position);
    }
    if (character.type === 'bowman' || character.type === 'vampire') {
      return this.move(2, gamer.position);
    }
    if (character.type === 'magician' || character.type === 'daemon') {
      return this.move(1, gamer.position);
    }
  }

  attack(step, gamer) {
    let arr = [];
    const buffer = 8;
    for (let i = 1; i <= step; i += 1) {
      arr.push(gamer + buffer * i);
      arr.push(gamer - buffer * i);
    }
    // left
    for (let i = 1; i <= step; i += 1) {
      if (this.left.indexOf(gamer) !== -1) {
        break;
      }

      arr.push(gamer - i);
      for (let j = 1; j <= step; j += 1) {
        arr.push(gamer - i + buffer * j);
        arr.push(gamer - i - buffer * j);
      }
      if (this.left.indexOf(gamer - i) !== -1) {
        break;
      }
    }
    // right
    for (let i = 1; i <= step; i += 1) {
      if (this.right.indexOf(gamer) !== -1) {
        break;
      }

      arr.push(gamer + i);
      for (let j = 1; j <= step; j += 1) {
        arr.push(gamer + i + buffer * j);
        arr.push(gamer + i - buffer * j);
      }
      if (this.right.indexOf(gamer + i) !== -1) {
        break;
      }
    }
    arr = arr.filter((item) => item >= 0 && item <= 63);
    return arr;
  }

  // eslint-disable-next-line consistent-return
  makeAttack(gamer) {
    const { character } = gamer;
    if (character.type === 'swordsman' || character.type === 'undead') {
      return this.attack(1, gamer.position);
    }
    if (character.type === 'bowman' || character.type === 'vampire') {
      return this.attack(2, gamer.position);
    }
    if (character.type === 'magician' || character.type === 'daemon') {
      return this.attack(4, gamer.position);
    }
  }

  onCellEnter(index) {
    const iconLevel = '\u{1F396}';
    const iconAttack = '\u{2694}';
    const icondefence = '\u{1F6E1}';
    const iconHealth = '\u{2764}';

    if (this.enter !== -1) {
      this.gamePlay.deselectCell(this.enter);
    }

    this.gamePlay.setCursor(cursors.pointer);

    if (this.position.find((pos) => pos.position === index)) {
      this.characterEnter = this.position.find((pos) => pos.position === index);
      const { character } = this.characterEnter;
      if (character.type === 'magician' || character.type === 'bowman' || character.type === 'swordsman') {
        const status = `${iconLevel}${character.level}${iconAttack}${character.attack}${icondefence}${character.defence}${iconHealth}${character.health}`;
        this.gamePlay.showCellTooltip(status, index);
      }
    } else {
      this.characterEnter = { position: -1, character: { type: 'none' } };
    }

    this.characterMove = this.makeMove(this.characterClick);
    // eslint-disable-next-line max-len
    if (this.characterMove.indexOf(this.characterEnter.position) === -1 && this.characterMove.indexOf(index) !== -1) {
      this.gamePlay.selectCell(this.click);
      this.gamePlay.setCursor(cursors.pointer);
      this.gamePlay.selectCell(index, 'green');
    }

    this.characterAttack = this.makeAttack(this.characterClick);
    if (this.characterEnter.character.type === 'undead' || this.characterEnter.character.type === 'vampire' || this.characterEnter.character.type === 'daemon') {
      this.gamePlay.selectCell(this.click);
      if (this.characterAttack.indexOf(this.characterEnter.position) !== -1) {
        this.gamePlay.setCursor(cursors.notallowed);
      } else {
        this.gamePlay.setCursor(cursors.crosshair);
        this.gamePlay.selectCell(index, 'red');
      }
    }
    this.enter = index;
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    this.gamePlay.hideCellTooltip(index);
  }
}
