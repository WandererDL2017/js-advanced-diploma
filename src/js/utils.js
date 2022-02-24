export function calcTileType(index, boardSize) {
  // TODO: write logic here
  const y = Math.floor(index / boardSize);
  const x = index - (y * boardSize);
  if (x === 0 && y === 0) {
    return 'top-left';
  }
  if (x === 0 && y === boardSize - 1) {
    return 'bottom-left';
  }
  if (x === 0 && y !== 0 && y < boardSize - 1) {
    return 'left';
  }
  if (x === boardSize - 1 && y === 0) {
    return 'top-right';
  }
  if (x === boardSize - 1 && y !== 0 && y < boardSize - 1) {
    return 'right';
  }
  if (x === boardSize - 1 && y === boardSize - 1) {
    return 'bottom-right';
  }
  if (x < boardSize && x !== 0 && y === 0) {
    return 'top';
  }
  if (x < boardSize && x !== 0 && y === boardSize - 1) {
    return 'bottom';
  }
  return 'center';
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}
