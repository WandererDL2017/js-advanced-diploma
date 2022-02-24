import themes from './themes';
import GamePlay from './GamePlay';
import PositionedCharacter from './PositionedCharacter';
import GameState from './GameState';
import cursors from './cursors';
import Bowman from './heroes/Bowman';
import Daemon from './heroes/Daemon';
import Magician from './heroes/Magician';
import Swordsman from './heroes/Swordsman';
import Undead from './heroes/Undead';
import Vampire from './heroes/Vampire';
import { generateTeam } from './generators';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.selected = undefined;
    this.movements = [];
    this.attackOpt = [];
    this.level = 1;
    this.score = 0;
    this.userTypes = [Bowman, Swordsman, Magician];
    this.enemyTypes = [Vampire, Undead, Daemon];
    this.position = [];
    this.occupiedCells = [];
    this.area = this.arrOfIndexes();
    this.userPositions = this.area.map((item) => item.slice(0, 2)).flat(); // [0, 1, 8, 9, 16, 17, 24, 25, 32, 33, 40, 41, 48, 49, 56, 57]
    this.enemyPositions = this.area.map((item) => item.slice(6, 8)).flat(); // [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63]
    this.player; // players turn: 1 - user, 0 - enemy;
  }

  init() {
    this.gamePlay.drawUi(themes.prairie);
    this.gamePlay.redrawPositions(this.generatePlayers(this.userPositions, this.userTypes.slice(0, 2)));
    this.gamePlay.redrawPositions(this.generatePlayers(this.enemyPositions, this.enemyTypes));

    // TODO: add event listeners to gamePlay events
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));

    // TODO: load saved stated from stateService
    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));
  }

  onNewGameClick() {
    this.level = 1;
    this.scores = 0;
    this.position = [];
    this.player = 1;
    this.userTeam = [];
    this.enemyTeam = [];
    this.gamePlay.drawUi(themes.prairie);
    this.gamePlay.redrawPositions(this.generatePlayers(this.userPositions, this.userTypes.slice(0, 2)));
    this.gamePlay.redrawPositions(this.generatePlayers(this.enemyPositions, this.enemyTypes));
  }

  generatePlayers(teamPositions, teamArr) {
    const team = generateTeam(teamArr, 1, 2);
    for (const character of team) {
      const pos = this.getRandomPosition(teamPositions);
      const char = new PositionedCharacter(character, pos);
      this.position.push(char);
    }
    return this.position;
  }

  getRandomPosition(teamPositions) {
    let index = teamPositions[Math.floor(Math.random() * teamPositions.length)];
    while (this.checkPosition(index)) {
      index = teamPositions[Math.floor(Math.random() * teamPositions.length)];
    }
    return index;
  }

  // to avoid the same random position
  checkPosition(index) {
    for (const pos of this.position) {
      if (index === pos.position) {
        return true;
      }
    }
    return false;
  }

  onSaveGameClick() {
    const savedGame = {
      level: this.level,
      activePlayer: this.player,
      position: this.position,
      scores: this.scores,
    };
    this.stateService.save(GameState.from(savedGame));
    GamePlay.showMessage('Saved');
  }

  onLoadGameClick() {
    const loaded = this.stateService.load();
    if (loaded) {
      this.level = loaded.level;
      this.player = loaded.activePlayer;
      this.position = loaded.position;
      this.scores = loaded.scores;
      switch (loaded.level) {
        case 1:
          this.gamePlay.drawUi(themes.prairie);
          break;
        case 2:
          this.gamePlay.drawUi(themes.desert);
          break;
        case 3:
          this.gamePlay.drawUi(themes.arctic);
          break;
        case 4:
          this.gamePlay.drawUi(themes.mountain);
          break;
        default:
          this.gamePlay.drawUi(themes.prairie);
          break;
      }
    } else {
      GamePlay.showError('Something wrong...');
    }
    this.gamePlay.redrawPositions(this.position);
  }

  newLevel() {
    if (this.level === 2) {
      this.gamePlay.drawUi(themes.desert);
      this.gamePlay.redrawPositions(this.position);
      this.gamePlay.redrawPositions(this.teamNewLevel(this.userPositions, this.userTypes, 1, 1));
      this.gamePlay.redrawPositions(this.teamNewLevel(this.enemyPositions, this.enemyTypes, 2, this.userTeam.length + 1));
    }
    if (this.level === 3) {
      this.gamePlay.drawUi(themes.arctic);
      this.gamePlay.redrawPositions(this.position);
      this.gamePlay.redrawPositions(this.teamNewLevel(this.userPositions, this.userTypes, 2, 2));
      this.gamePlay.redrawPositions(this.teamNewLevel(this.enemyPositions, this.enemyTypes, 3, this.userTeam.length + 2));
    }
    if (this.level === 4) {
      this.gamePlay.drawUi(themes.mountain);
      this.gamePlay.redrawPositions(this.position);
      this.gamePlay.redrawPositions(this.teamNewLevel(this.userPositions, this.userTypes, 3, 2));
      this.gamePlay.redrawPositions(this.teamNewLevel(this.enemyPositions, this.enemyTypes, 4, this.userTeam.length + 2));
    }
    // default:
    //   this.gamePlay.drawUi(themes.prairie);
    //   this.gamePlay.redrawPositions(this.generatePlayers(this.userPositions, this.userTypes.slice(0, 2)));
    //   this.gamePlay.redrawPositions(this.generatePlayers(this.enemyPositions, this.enemyTypes));
    //   break;
  }

  // generation of new characters in accordance with a current level
  teamNewLevel(teamPositions, teamArr, level, charAmount) {
    const team = generateTeam(teamArr, level, charAmount);
    for (const char of team) {
      this.position.push(new PositionedCharacter(char, this.getRandomPosition(teamPositions)));
    }
    return this.position;
  }

  checkGameStatus() {
    // to get array of current characters
    this.enemyTeam = this.position.filter((element) => ['vampire', 'undead', 'daemon'].includes(element.character.type));
    this.userTeam = this.position.filter((element) => ['bowman', 'swordsman', 'magician'].includes(element.character.type));

    // check status of the game
    if (this.enemyTeam.length === 0) {
      this.level += 1;
      for (const user of this.userTeam) {
        this.score += user.character.health;
        console.log(this.score);
        user.character.level += 1;
        user.character.health += 80;
        if (user.character.health > 100) {
          user.character.health = 100;
        }
        user.character.attack = Math.max(user.character.attack, (user.character.attack * (80 + user.character.health)) / 100);
        user.character.defence = Math.max(user.character.defence, (user.character.defence * (80 + user.character.health)) / 100);
      }
      // this.userTeam.forEach((char) => Character.levelUp.call(char));
      this.newLevel();
    } else if (this.userTeam.length === 0) {
      GamePlay.showMessage('Game over');
      this.gamePlay.cellClickListeners = [];
      this.gamePlay.cellEnterListeners = [];
      this.gamePlay.cellLeaveListeners = [];
    } else if (this.level >= 4 && this.enemyTeam.length === 0) {
      GamePlay.showMessage('Congrats! You`re win!');
      this.gamePlay.cellClickListeners = [];
      this.gamePlay.cellEnterListeners = [];
      this.gamePlay.cellLeaveListeners = [];
    }
  }

  onCellClick(index) {
    // TODO: react to click
    const currentPosition = this.position.find((element) => element.position === index);

    // to get cells occupied by enemy team
    this.occupiedCells = this.position.filter((pos) => (pos.character.type === 'daemon' || pos.character.type === 'undead' || pos.character.type === 'vampire')).map((pos) => pos.position);

    // character selection
    if (currentPosition !== undefined && !this.occupiedCells.includes(index)) {
      this.position.forEach((element) => this.gamePlay.deselectCell(element.position));
      this.gamePlay.selectCell(index);
      this.selected = currentPosition;
      this.movements = this.getMovesOptions(this.selected.position, this.selected.character.moveDistance);
      this.attackOpt = this.getAttackOptions(this.selected.position, this.selected.character.attackDistance);
    } else if (this.movements.includes(index) && !this.occupiedCells.includes(index)) {
      // if (this.player !== 1) {
      //   this.enemyAction();
      // }
      this.gamePlay.deselectCell(this.selected.position);
      this.selected.position = index;
      this.gamePlay.redrawPositions(this.position);
      this.gamePlay.selectCell(index);
      this.enemyAction();
    } else if (currentPosition && !(this.attackOpt.includes(index))) {
      GamePlay.showError('Please choose a relevant character');
    }

    // user to attack enemy
    if (this.selected && this.attackOpt.includes(index) && this.occupiedCells.includes(index)) {
      const target = currentPosition;
      this.toAttack(index, this.selected.character, target.character);
      this.enemyAction();
      this.checkGameStatus();
    }
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    const currentPosition = this.position.find((element) => element.position === index);

    // tooltip
    const icons = {
      level: '\u{1F396}',
      attack: '\u{2694}',
      defence: '\u{1F6E1}',
      health: '\u{2764}',
    };
    if (currentPosition) {
      const message = `${icons.level}${currentPosition.character.level}${icons.attack}${currentPosition.character.attack}${icons.defence}${currentPosition.character.defence}${icons.health}${currentPosition.character.health}`;
      this.gamePlay.showCellTooltip(message, index);
      this.gamePlay.setCursor(cursors.pointer);
      if (['vampire', 'undead', 'daemon'].includes(currentPosition.character.type)) {
        this.gamePlay.setCursor(cursors.notallowed);
      }
    } else {
      this.gamePlay.setCursor(cursors.auto);
    }
    // change cursors
    if (this.selected && !currentPosition) {
      this.movements = this.getMovesOptions(this.selected.position, this.selected.character.moveDistance);
      // console.log(this.movements);
      if (this.movements.includes(index)) {
        this.gamePlay.selectCell(index, 'green');
        this.gamePlay.setCursor(cursors.pointer);
      }
    }
    if (this.selected && currentPosition && ['vampire', 'undead', 'daemon'].includes(currentPosition.character.type)) {
      this.attackOpt = this.getAttackOptions(this.selected.position, this.selected.character.attackDistance);
      if (this.attackOpt.includes(index)) {
        this.gamePlay.selectCell(index, 'red');
        this.gamePlay.setCursor(cursors.crosshair);
      }
    }
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    this.gamePlay.hideCellTooltip(index);
    if (this.selected !== undefined && this.selected.position !== index) {
      this.gamePlay.deselectCell(index);
    }
  }

  arrOfIndexes() {
    const area = [];
    let rowArr = [];
    for (let i = 0; i < this.gamePlay.boardSize ** 2; i++) {
      rowArr.push(i);
      if (rowArr.length === this.gamePlay.boardSize) {
        area.push(rowArr);
        rowArr = [];
      }
    }
    return area;
  }

  getMovesOptions(currentPosition, distance) {
    const columnIndex = currentPosition % this.gamePlay.boardSize;
    const rowIndex = Math.floor(currentPosition / this.gamePlay.boardSize);
    const availableIndexArr = [];
    for (let i = 1; i <= distance; i += 1) {
      // one column to the right
      let availableColumnIndex = columnIndex + i;
      if (availableColumnIndex < this.gamePlay.boardSize) {
        availableIndexArr.push(this.area[rowIndex][availableColumnIndex]);
      }

      // one line down
      let availableRowIndex = rowIndex + i;
      if (availableRowIndex < this.gamePlay.boardSize) {
        availableIndexArr.push(this.area[availableRowIndex][columnIndex]);
      }

      // diagonal down/right
      if ((availableRowIndex < this.gamePlay.boardSize) && (availableColumnIndex < this.gamePlay.boardSize)) {
        availableIndexArr.push(this.area[availableRowIndex][availableColumnIndex]);
      }

      // one column to the left
      availableColumnIndex = columnIndex - i;
      if (availableColumnIndex >= 0) {
        availableIndexArr.push(this.area[rowIndex][availableColumnIndex]);
      }

      // diagonal down/left
      if ((availableColumnIndex >= 0) && (availableRowIndex < this.gamePlay.boardSize)) {
        availableIndexArr.push(this.area[availableRowIndex][availableColumnIndex]);
      }

      // one line up
      availableRowIndex = rowIndex - i;
      if (availableRowIndex >= 0) {
        availableIndexArr.push(this.area[availableRowIndex][columnIndex]);
      }

      // diagonal up/left
      if ((availableRowIndex >= 0) && (availableColumnIndex >= 0)) {
        availableIndexArr.push(this.area[availableRowIndex][availableColumnIndex]);
      }

      // diagonal up/right
      availableColumnIndex = columnIndex + i;
      if ((availableColumnIndex < this.gamePlay.boardSize) && (availableRowIndex >= 0)) {
        availableIndexArr.push(this.area[availableRowIndex][availableColumnIndex]);
      }
    }
    return availableIndexArr;
  }

  getAttackOptions(currentPosition, distance) {
    const columnIndex = currentPosition % this.gamePlay.boardSize;
    const rowIndex = Math.floor(currentPosition / this.gamePlay.boardSize);
    let availableIndexArr = [];
    let upwardAttack = rowIndex - distance;
    let downAttack = rowIndex + distance;
    let leftAttack = columnIndex - distance;
    let rightAttack = columnIndex + distance;
    if (upwardAttack < 0) {
      upwardAttack = 0;
    } else if (downAttack > this.gamePlay.boardSize - 1) {
      downAttack = this.gamePlay.boardSize - 1;
    } else if (leftAttack < 0) {
      leftAttack = 0;
    } else if (rightAttack > this.gamePlay.boardSize - 1) {
      rightAttack = this.gamePlay.boardSize - 1;
    }
    for (let i = upwardAttack; i <= downAttack; i++) {
      for (let j = leftAttack; j <= rightAttack; j++) {
        availableIndexArr.push(this.area[i][j]);
      }
    }
    availableIndexArr = availableIndexArr.filter((element) => element !== currentPosition);
    availableIndexArr = availableIndexArr.filter((element) => element >= 0 && element <= 63);
    return availableIndexArr;
  }

  toAttack(index, activeChar, target) {
    const damageScores = Math.max(activeChar.attack - target.defence, activeChar.attack * 0.1);
    target.health -= damageScores;
    if (target.health <= 0) {
      target.health = 0;
      this.position = this.position.filter((char) => char.position !== index);
    }
    this.gamePlay.deselectCell(index);
    this.gamePlay.showDamage(index, damageScores).then(() => {
      this.checkGameStatus();
      this.gamePlay.redrawPositions(this.position);
    });
  }

  enemyAction() {
    this.gamePlay.deselectCell(this.selected.position);
    this.player = 0;
    this.enemyTeam = this.position.filter((char) => char.character.type === 'daemon' || char.character.type === 'undead' || char.character.type === 'vampire');
    this.userTeam = this.position.filter((element) => ['bowman', 'swordsman', 'magician'].includes(element.character.type));

    const randomEnemyChar = () => this.enemyTeam[Math.floor(Math.random() * this.enemyTeam.length)];
    if (randomEnemyChar()) {
      this.movements = this.getMovesOptions(randomEnemyChar().position, randomEnemyChar().character.moveDistance);
      this.attackOpt = this.getAttackOptions(randomEnemyChar().position, randomEnemyChar().character.attackDistance);

      // if there is someone to be attacked
      for (const user of this.userTeam) {
        if (this.attackOpt.indexOf(user.position) !== -1) {
          this.toAttack(user.position, randomEnemyChar().character, user.character);
          this.player = 1;
          return;
        }
        // to make a move
        randomEnemyChar().position = this.getRandomPosition(this.movements);
        this.gamePlay.redrawPositions(this.position);
        this.player = 1;
        return;
      }
    }
  }
}