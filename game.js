/*
  Simple Pente Implementation

  Rules implemented:
  - 19x19 board.
  - Two players alternate placing stones (Black first).
  - A win occurs if:
    * A player gets five (or more) in a row horizontally, vertically, or diagonally.
    * A player captures 5 pairs of the opponent’s stones.
  - Capturing:
    * If you place a stone and exactly two opponent stones are in a line next to it,
      and you have another stone on the other side, you capture those two stones.
    * Example: B _ W W _ => Placing a B in the blank spot on either side of the two W’s
      captures those W’s.
*/

/*
  Simple Pente Implementation

  ... (Your existing comments and code)
*/

// AI Toggle
let useAI = false; // AI off by default
const toggleAiBtn = document.getElementById('toggleAiBtn');

toggleAiBtn.addEventListener('click', () => {
  useAI = !useAI;
  toggleAiBtn.textContent = `Toggle AI: ${useAI ? "ON" : "OFF"}`;
});

// Board configuration
const BOARD_SIZE = 19;
const CELL_SIZE = 600 / BOARD_SIZE;
const boardCanvas = document.getElementById('board');
const ctx = boardCanvas.getContext('2d');

// Represent the board as a 2D array: 0=empty, 1=black, 2=white
let board = [];
for (let i = 0; i < BOARD_SIZE; i++) {
  board[i] = [];
  for (let j = 0; j < BOARD_SIZE; j++) {
    board[i][j] = 0;
  }
}

// Game state
let currentPlayer = 1; // 1=black, 2=white
let blackCaptures = 0;
let whiteCaptures = 0;
let gameOver = false;

// Add this line for the pro rule
let blackFirstMoveMade = false;

const statusDiv = document.getElementById('status');
updateStatus();

// Draw initial board
drawBoard();

// Handle click events
boardCanvas.addEventListener('click', (e) => {
  if (gameOver) return;

  const rect = boardCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const row = Math.floor(y / CELL_SIZE);
  const col = Math.floor(x / CELL_SIZE);

  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;

  // **PRO RULE IMPLEMENTATION START**
  // If it's Black's first move, they must place at the center.
  if (currentPlayer === 1 && !blackFirstMoveMade) {
    const centerRow = Math.floor(BOARD_SIZE / 2);
    const centerCol = Math.floor(BOARD_SIZE / 2);
    if (row !== centerRow || col !== centerCol) {
      // Not the center, do nothing and return
      return;
    }
  }
  // **PRO RULE IMPLEMENTATION END**

  if (board[row][col] === 0) {
    // Place stone
    board[row][col] = currentPlayer;

    // If this was Black's first move and it's valid, mark it as done
    if (currentPlayer === 1 && !blackFirstMoveMade) {
      blackFirstMoveMade = true;
    }

    checkCaptures(row, col);

    if (checkWin(row, col)) {
      drawBoard();
      gameOver = true;
      updateStatus(true);
    } else {
      drawBoard();
      // Switch player
      currentPlayer = (currentPlayer === 1) ? 2 : 1;
      updateStatus();

      // If AI is enabled and it's now the AI's turn (player 2)
      if (!gameOver && useAI && currentPlayer === 2) {
        setTimeout(() => {
          // Example placeholder: AI picks a random move (replace with getAIMove logic)
          const move = getRandomEmptyCell(board);
          if (move) {
            board[move.r][move.c] = 2;
            drawBoard();
            checkCaptures(move.r, move.c);
            if (checkWin(move.r, move.c)) {
              gameOver = true;
              updateStatus(true);
            } else {
              currentPlayer = 1;
              updateStatus();
            }
          }
        }, 500);
      }
    }
  }
});

// ... The rest of your existing code like drawBoard(), drawStone(), updateStatus(), checkWin(), checkCaptures(), etc.

function drawBoard() {
  ctx.clearRect(0, 0, 600, 600);

  // Draw grid
  ctx.strokeStyle = "#333";
  for (let i = 0; i < BOARD_SIZE; i++) {
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2);
    ctx.lineTo(i * CELL_SIZE + CELL_SIZE / 2, 600 - CELL_SIZE / 2);
    ctx.stroke();
    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(CELL_SIZE / 2, i * CELL_SIZE + CELL_SIZE / 2);
    ctx.lineTo(600 - CELL_SIZE / 2, i * CELL_SIZE + CELL_SIZE / 2);
    ctx.stroke();
    // Calculate center coordinates
    const centerX = BOARD_SIZE / 2 * CELL_SIZE;
    const centerY = BOARD_SIZE / 2 * CELL_SIZE;
    // Draw coordinates
    ctx.font = "10px Arial"; // Adjust font size as needed
    ctx.fillStyle = "black";

    // Numbers (19-0) along the left side
    for (let i = 0; i < BOARD_SIZE; i++) {
      const x = CELL_SIZE / 4 - 5; // Adjust offset as needed

      // Calculate the y-coordinate
      const y = i * CELL_SIZE + CELL_SIZE / 1.5 - 4;

      // Display the number starting from 19 and counting down
      ctx.fillText(19 - i, x, y);
    }


    // Letters (A-S) along the top
    const letters = "ABCDEFGHJKLMNOPQRST"; // No "I" in Pente notation
    for (let i = 0; i < BOARD_SIZE; i++) {
      const x = i * CELL_SIZE + CELL_SIZE / 4 + 4;;
      const y = CELL_SIZE / 2 - 5; // Adjust offset as needed
      ctx.fillText(letters[i], x, y);
    }
    // Draw the center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, CELL_SIZE * 0.1, 0, 2 * Math.PI); // Adjust radius as needed
    ctx.fillStyle = 'black'; // Or any color you prefer
    ctx.fill();
  }
  // Draw additional dots
  function drawDot(column, row) {
    const x = column * CELL_SIZE + CELL_SIZE / 2; // Center of the column
    const y = row * CELL_SIZE + CELL_SIZE / 2;   // Center of the row
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE * 0.1, 0, 2 * Math.PI); // Adjust radius as needed
    ctx.fillStyle = 'black'; // Or any color you prefer
    ctx.fill();
  }

  // Coordinates for additional dots
  const dots = [
    { column: 6, row: 12 }, // G13 (0-indexed, column 6, row 12)
    { column: 12, row: 12 }, // N13 (column 13, row 12)
    { column: 6, row: 6 }, // G7 (column 6, row 6)
    { column: 12, row: 6 }, // N7 (column 13, row 6)
  ];

  // Draw each dot
  dots.forEach(dot => drawDot(dot.column, dot.row));

  // Draw stones
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0) {
        drawStone(r, c, board[r][c]);
      }
    }
  }
}

function drawStone(row, col, player) {
  const x = col * CELL_SIZE + CELL_SIZE / 2;
  const y = row * CELL_SIZE + CELL_SIZE / 2;
  const radius = CELL_SIZE * 0.4;

  // Create a radial gradient
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

  if (player === 1) {
    // Black stone with 3D effect
    gradient.addColorStop(0, 'rgba(60, 60, 60, 1)'); // Darker gray in the center
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');   // Black at the edge
  } else {
    // White stone with 3D effect
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // White in the center
    gradient.addColorStop(1, 'rgba(200, 200, 200, 1)'); // Light gray at the edge
  }

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = gradient; // Use the gradient as the fill style
  ctx.fill();

  // You can keep the stroke for white stones if you like
  if (player === 2) {
    ctx.stroke();
  }
}
function updateStatus(won = false) {
  let msg = `Current Player: ${currentPlayer === 1 ? "Black" : "White"}`;
  msg += ` | Black captures: ${blackCaptures}, White captures: ${whiteCaptures}`;

  if (won) {
    // Check if the win was due to captures
    if (blackCaptures >= 5) {
      msg = "Black wins by capture!";
    } else if (whiteCaptures >= 5) {
      msg = "White wins by capture!";
    } else {
      // Otherwise, it's a 5-in-a-row win
      msg = (currentPlayer === 1 ? "Black" : "White") + " wins!";
    }
  }

  statusDiv.textContent = msg;
}
function getWinningStones(row, col, dr, dc, count) {
    const winningStones = [];
    const stoneSet = new Set();

    for (let i = 0; i < count; i++) {
        const r = row + i * dr;
        const c = col + i * dc;
        const key = `${r},${c}`;

        console.log("Stone Key:", key); // Output the key
        console.log("Stone Set:", stoneSet); // Output the set

        if (!stoneSet.has(key)) {
            stoneSet.add(key);
            winningStones.push({ r, c });
        }
    }

    console.log("Winning stones calculated:", winningStones);
    return winningStones;
}

function checkWin(row, col) {
    // Check for 5 in a row (including capture-based win check)
    const directions = [
        { dr: 1, dc: 0 },
        { dr: 0, dc: 1 },
        { dr: 1, dc: 1 },
        { dr: 1, dc: -1 }
    ];

    for (let d of directions) {
        let count = countInDirection(row, col, d.dr, d.dc);
        if (count >= 5) {
            const winningStones = getWinningStones(row, col, d.dr, d.dc, count);
            highlightStones(winningStones);
            return true;
        }
    }

    // Check for capture-based win if no 5-in-a-row win is found
    if (blackCaptures >= 5 || whiteCaptures >= 5) {
        return true;
    }

    return false;
}

function highlightStones(stones) {
    const highlighted = new Set(); // Keep track of highlighted stones

    for (let stone of stones) {
        const key = `${stone.r},${stone.c}`; // Create a unique key for each stone
        if (!highlighted.has(key)) {
            highlighted.add(key);

            const x = stone.c * CELL_SIZE + CELL_SIZE / 2;
            const y = stone.r * CELL_SIZE + CELL_SIZE / 2;
            const radius = CELL_SIZE * 0.4;

            // Draw a red outline to highlight (adjust color/thickness as needed)
            ctx.beginPath();
            ctx.arc(x, y, radius + 5, 0, 2 * Math.PI); // Increased radius for visibility
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3; // Thicker outline
            ctx.stroke();
        }
    }
}


function countInDirection(row, col, dr, dc) {
    const player = board[row][col];
    let count = 1; // Start with 1 for the placed stone

    // Check in forward direction
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c) && board[r][c] === player) {
        count++;
        r += dr;
        c += dc;
    }

    // Check in backward direction
    r = row - dr;
    c = col - dc;
    while (inBounds(r, c) && board[r][c] === player) {
        count++;
        r -= dr;
        c -= dc;
    }

    return count;
}

function inBounds(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function checkCaptures(row, col) {
    const player = board[row][col];
    const opponent = (player === 1) ? 2 : 1;

    const directions = [
        { dr: 1, dc: 0 }, { dr: -1, dc: 0 },
        { dr: 0, dc: 1 }, { dr: 0, dc: -1 },
        { dr: 1, dc: 1 }, { dr: -1, dc: -1 },
        { dr: 1, dc: -1 }, { dr: -1, dc: 1 }
    ];

    for (let d of directions) {
        let r1 = row + d.dr;
        let c1 = col + d.dc;
        let r2 = row + 2 * d.dr;
        let c2 = col + 2 * d.dc;
        let r3 = row + 3 * d.dr;
        let c3 = col + 3 * d.dc;

        if (inBounds(r1, c1) && inBounds(r2, c2) && inBounds(r3, c3)) {
            if (board[r1][c1] === opponent && board[r2][c2] === opponent && board[r3][c3] === player) {
                board[r1][c1] = 0;
                board[r2][c2] = 0;
                if (player === 1) blackCaptures++;
                else whiteCaptures++;
                // The drawBoard() call was removed from here
            }
        }
    }
}

// Optional: For demonstration, a function to get a random empty cell (if no AI logic is present)
function getRandomEmptyCell(board) {
  let emptyCells = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 0) {
        emptyCells.push({ r, c });
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}
// Select the restart button
const restartBtn = document.getElementById('restartBtn');

// Add a click event listener
restartBtn.addEventListener('click', initGame);

function initGame() {
  // Reset the board to empty
  board = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < BOARD_SIZE; j++) {
      board[i][j] = 0;
    }
  }

  // Reset game state
  currentPlayer = 1;   // Black starts
  blackCaptures = 0;
  whiteCaptures = 0;
  gameOver = false;

  // Redraw the board and update status
  drawBoard();
  updateStatus();

  // Optionally, hide the restart button until the game ends again
  // restartBtn.style.display = 'none';
}
