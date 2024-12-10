// ai.js - A heuristic-based AI for Pente

// Configuration for scoring (feel free to adjust)
const SCORE_WIN = 100000;   // Move that results in an immediate win
const SCORE_FOUR = 1000;    // Four in a row (not yet winning but close)
const SCORE_THREE = 100;    // Three in a row
const SCORE_TWO = 20;       // Two in a row
const SCORE_CAPTURE = 200;  // Creating a capture
const SCORE_BLOCK = 500;    // Blocking opponent’s imminent win

// The AI: Given a board and the AI's player number (2=white), return the best move {r, c}
function getAIMove(board, player) {
  let bestScore = -Infinity;
  let bestMove = null;

  const opponent = (player === 1) ? 2 : 1;

  // Generate a list of empty cells
  let emptyCells = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 0) {
        emptyCells.push({r, c});
      }
    }
  }

  // If no moves left
  if (emptyCells.length === 0) return null;

  // Evaluate each potential move
  for (let move of emptyCells) {
    // Place the stone temporarily
    board[move.r][move.c] = player;

    // Evaluate board score from AI’s perspective
    let score = evaluateBoard(board, player);

    // Also consider blocking: If opponent is about to win on next move,
    // and this move blocks them, add a blocking bonus.
    // To check opponent’s potential win, we can temporarily place opponent’s piece
    // and see if they would win next turn if we didn’t occupy this cell.
    // For simplicity, just score higher if this move intersects with a high-risk area.
    // (A full threat-detection system would be more complex.)
    score += evaluateBlocking(board, player, opponent, move.r, move.c);

    // Remove the stone after evaluation
    board[move.r][move.c] = 0;

    // Track the best move
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// Evaluate board for scoring lines and captures for a given player
function evaluateBoard(board, player) {
  const opponent = (player === 1) ? 2 : 1;
  let playerScore = 0;
  let opponentScore = 0;

  // Check all directions for sequences
  const directions = [
    {dr: 1, dc: 0},   // vertical
    {dr: 0, dc: 1},   // horizontal
    {dr: 1, dc: 1},   // diagonal down-right
    {dr: 1, dc: -1}   // diagonal down-left
  ];

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === player) {
        // Evaluate lines starting from this cell in each direction
        for (let d of directions) {
          const length = countInDirection(board, r, c, d.dr, d.dc, player);
          playerScore += scoreForLength(length);

          // Check captures in this direction as well
          playerScore += checkCapturePotential(board, r, c, d, player);
        }
      } else if (board[r][c] === opponent) {
        for (let d of directions) {
          const length = countInDirection(board, r, c, d.dr, d.dc, opponent);
          opponentScore += scoreForLength(length);

          // Check captures for opponent
          opponentScore += checkCapturePotential(board, r, c, d, opponent);
        }
      }
    }
  }

  // If the player can win immediately, return a huge score
  if (checkImmediateWin(board, player)) {
    return SCORE_WIN;
  }

  // Otherwise, overall score is player’s patterns minus opponent’s patterns
  return playerScore - opponentScore;
}

// Count continuous stones of the same player along a given direction
function countInDirection(board, row, col, dr, dc, player) {
  let count = 1;

  // forward
  let r = row + dr;
  let c = col + dc;
  while (inBounds(board, r, c) && board[r][c] === player) {
    count++;
    r += dr; c += dc;
  }

  // backward
  r = row - dr; c = col - dc;
  while (inBounds(board, r, c) && board[r][c] === player) {
    count++;
    r -= dr; c -= dc;
  }

  return count;
}

// Convert a sequence length into a score
function scoreForLength(length) {
  if (length >= 5) {
    return SCORE_WIN;
  } else if (length === 4) {
    return SCORE_FOUR;
  } else if (length === 3) {
    return SCORE_THREE;
  } else if (length === 2) {
    return SCORE_TWO;
  }
  return 0;
}

// Check capture potential in a given direction. If placing a stone can capture, add points.
function checkCapturePotential(board, row, col, d, player) {
  // To detect captures, we look for patterns P O O P with our current player as P and Opponent as O.
  // However, we are evaluating a static board. For scoring potential, we might give points if a pair of opponent stones
  // is flanked by player stones or potential spots.
  // This is a simplified approach: if from (row,col) going forward we see a pattern that could be captured, score it.

  const opponent = (player === 1) ? 2 : 1;
  let score = 0;

  // Check two steps ahead for a possible capture scenario
  // Pattern: player - opponent - opponent - player
  // We'll scan a small line around (row,col) for that pattern.

  // Start by moving one step forward
  let r1 = row + d.dr;
  let c1 = col + d.dc;
  let r2 = row + 2*d.dr;
  let c2 = col + 2*d.dc;
  let r3 = row + 3*d.dr;
  let c3 = col + 3*d.dc;

  if (inBounds(board, r3, c3)) {
    if (board[row][col] === player &&
        inBounds(board, r1, c1) && inBounds(board, r2, c2) &&
        board[r1][c1] === opponent &&
        board[r2][c2] === opponent &&
        board[r3][c3] === player) {
      score += SCORE_CAPTURE;
    }
  }

  return score;
}

// Check if a player can win immediately (5 in a row)
function checkImmediateWin(board, player) {
  const directions = [
    { dr: 1, dc: 0 },
    { dr: 0, dc: 1 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 }
  ];

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === player) {
        for (let d of directions) {
          if (countInDirection(board, r, c, d.dr, d.dc, player) >= 5) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Evaluate blocking: If the opponent could win soon, placing a stone here might block it.
function evaluateBlocking(board, player, opponent, row, col) {
  // Simple approach: If by placing here you reduce opponent's max line length in the area, score some blocking points.
  // This is a very rough heuristic.
  let beforeMax = maxLineLength(board, opponent);
  // Temporarily place the AI stone
  board[row][col] = player;
  let afterMax = maxLineLength(board, opponent);
  // Remove the stone
  board[row][col] = 0;

  // If opponent’s best line length was reduced by this placement, it's a good block.
  if (afterMax < beforeMax && beforeMax >= 4) {
    return SCORE_BLOCK;
  }
  return 0;
}

// Calculate the maximum line length the given player currently has
function maxLineLength(board, player) {
  let maxLen = 0;
  const directions = [
    { dr: 1, dc: 0 },
    { dr: 0, dc: 1 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 }
  ];

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === player) {
        for (let d of directions) {
          let length = countInDirection(board, r, c, d.dr, d.dc, player);
          if (length > maxLen) {
            maxLen = length;
          }
        }
      }
    }
  }

  return maxLen;
}

function inBounds(board, r, c) {
  return r >= 0 && r < board.length && c >= 0 && c < board[r].length;
}
