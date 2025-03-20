const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
// 设置缩放比例，300/15=20,600/30=20
context.scale(20, 20);

const nextCanvas = document.getElementById('next-piece');
const nextCtx = nextCanvas.getContext('2d');
nextCtx.scale(20, 20);

const matrixes = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  L: [
    [0, 2, 0],
    [0, 2, 0],
    [0, 2, 2]
  ],
  J: [
    [0, 3, 0],
    [0, 3, 0],
    [3, 3, 0]
  ],
  O: [
    [4, 4],
    [4, 4]
  ],
  Z: [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0]
  ],
  S: [
    [0, 6, 6],
    [6, 6, 0],
    [0, 0, 0]
  ],
  T: [
    [0, 7, 0],
    [7, 7, 7],
    [0, 0, 0]
  ]
};

const colors = [
  null,
  '#00f0f0', // I
  '#f0a000', // L
  '#0000f0', // J
  '#f0f000', // O
  '#f00000', // Z
  '#00f000', // S
  '#a000f0'  // T
];

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerReset() {
  player.matrix = nextPiece;
  player.pos.y = 0;
  player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
  nextPiece = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
  drawNext();
  if (collide(arena, player)) {
    document.getElementById('game-over').style.display = 'block';
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.lines = 0;
    updateScore();
    setTimeout(() => {
      document.getElementById('game-over').style.display = 'none';
    }, 2000);
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function createPiece(type) {
  const piece = matrixes[type];
  return piece.map(row => row.slice());
}

function arenaSweep() {
  let rowCount = 0;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++rowCount;
    ++y;
  }
  if (rowCount > 0) {
    player.score += rowCount * 10;
    player.lines += rowCount;
  }
}

function drawMatrix(matrix, offset, ctx = context) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  drawMatrix(nextPiece, { x: 1, y: 1 }, nextCtx);
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let paused = false;
const pieces = ['T', 'J', 'L', 'O', 'S', 'Z', 'I'];
let nextPiece = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);

function update(time = 0) {
  if (paused) return;
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

function updateScore() {
  document.getElementById('score').innerText = player.score;
  document.getElementById('lines').innerText = player.lines;
}

const arena = createMatrix(15, 30);
const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
  lines: 0
};

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') {
    playerMove(-1);
  } else if (e.key === 'ArrowRight') {
    playerMove(1);
  } else if (e.key === 'ArrowDown') {
    playerDrop();
  } else if (e.key === 'ArrowUp') {
    // 向上键旋转方块
    playerRotate(1);
  } else if (e.key === 'q') {
    playerRotate(-1);
  } else if (e.key === 'w') {
    playerRotate(1);
  }
});

document.getElementById('start').addEventListener('click', () => {
  playerReset();
  updateScore();
  paused = false;
  update();
});

document.getElementById('pause').addEventListener('click', () => {
  paused = !paused;
  if (!paused) {
    update();
  }
});

// 五彩泡泡动画
function createBubble() {
  const bubble = document.createElement('div');
  const size = Math.random() * 20 + 10;
  bubble.classList.add('bubble');
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  bubble.style.left = `${Math.random() * 100}%`;
  bubble.style.background = `hsl(${Math.random() * 360}, 100%, 70%)`;
  bubble.style.animationDuration = `${5 + Math.random() * 5}s`;
  document.body.appendChild(bubble);
  setTimeout(() => {
    document.body.removeChild(bubble);
  }, 10000);
}
setInterval(createBubble, 500);
