const board = document.getElementById("sudoku-board");
const newGameBtn = document.getElementById("new-game");
const checkBtn = document.getElementById("check");
const resetBtn = document.getElementById("reset");
const hintBtn = document.getElementById("hint");
const difficultySelect = document.getElementById("difficulty");
const timerDisplay = document.getElementById("timer");
const themeToggle = document.getElementById("theme-toggle");
const saveBtn = document.getElementById("save");
const loadBtn = document.getElementById("load");

let timer = 0;
let interval;
let solution = [];
let puzzle = [];
let currentInputs = [];

function startTimer() {
  clearInterval(interval);
  timer = 0;
  timerDisplay.textContent = "00:00";
  interval = setInterval(() => {
    timer++;
    const minutes = String(Math.floor(timer / 60)).padStart(2, "0");
    const seconds = String(timer % 60).padStart(2, "0");
    timerDisplay.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(interval);
}

function deepCopy(arr) {
  return arr.map(row => row.slice());
}

// Sudoku solver using backtracking
function solve(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solve(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Check if placing number is valid
function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  let boxRowStart = Math.floor(row / 3) * 3;
  let boxColStart = Math.floor(col / 3) * 3;
  for (let r = boxRowStart; r < boxRowStart + 3; r++) {
    for (let c = boxColStart; c < boxColStart + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

// Generate a full solved board (backtracking)
function generateFullBoard() {
  let board = Array.from({ length: 9 }, () => Array(9).fill(0));

  function fillBoard() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          let numbers = shuffle([1,2,3,4,5,6,7,8,9]);
          for (let num of numbers) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (fillBoard()) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }
  fillBoard();
  return board;
}

// Shuffle helper
function shuffle(arr) {
  let a = arr.slice();
  for (let i = a.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Remove cells based on difficulty
function removeCells(board, difficulty) {
  let cellsToRemove;
  switch (difficulty) {
    case "easy": cellsToRemove = 35; break;
    case "medium": cellsToRemove = 45; break;
    case "hard": cellsToRemove = 55; break;
    default: cellsToRemove = 45;
  }
  let puzzle = board.map(row => row.slice());
  while (cellsToRemove > 0) {
    let r = Math.floor(Math.random() * 9);
    let c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      cellsToRemove--;
    }
  }
  return puzzle;
}

// Render board on page
function renderBoard(puzzleBoard) {
  board.innerHTML = "";
  currentInputs = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cellDiv = document.createElement("div");
      cellDiv.classList.add("cell");
      // Thicker borders for boxes handled by CSS nth-child

      if (puzzleBoard[r][c] !== 0) {
        const input = document.createElement("input");
        input.type = "text";
        input.value = puzzleBoard[r][c];
        input.disabled = true;
        input.setAttribute("aria-label", `Row ${r+1} Column ${c+1} Number ${puzzleBoard[r][c]}`);
        cellDiv.appendChild(input);
      } else {
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 1;
        input.setAttribute("inputmode", "numeric");
        input.setAttribute("aria-label", `Row ${r+1} Column ${c+1} input`);
        input.addEventListener("input", e => {
          // Only allow 1-9 digits
          const val = e.target.value;
          if (!/^[1-9]$/.test(val)) {
            e.target.value = "";
            return;
          }
          clearCellStyles(e.target.parentElement);
        });
        cellDiv.appendChild(input);
        currentInputs.push(input);
      }
      board.appendChild(cellDiv);
    }
  }
}

// Clear color styles on cell
function clearCellStyles(cellDiv) {
  cellDiv.classList.remove("correct", "incorrect", "hint");
}

// Check user inputs against solution
function checkSolution() {
  let allCorrect = true;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cellIndex = r * 9 + c;
      const cellDiv = board.children[cellIndex];
      clearCellStyles(cellDiv);
      const input = cellDiv.querySelector("input");
      if (puzzle[r][c] === 0) {
        const val = input.value ? parseInt(input.value, 10) : 0;
        if (val === solution[r][c]) {
          cellDiv.classList.add("correct");
        } else {
          cellDiv.classList.add("incorrect");
          allCorrect = false;
        }
      }
    }
  }
  if (allCorrect) {
    alert("🎉 Congratulations! You solved the puzzle!");
    stopTimer();
  }
}

// Give a hint: fill one empty cell correctly
function giveHint() {
  let empties = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle[r][c] === 0) {
        const cellIndex = r * 9 + c;
        const cellDiv = board.children[cellIndex];
        const input = cellDiv.querySelector("input");
        if (input.value === "") {
          empties.push({ r, c, input, cellDiv });
        }
      }
    }
  }
  if (empties.length === 0) {
    alert("No empty cells left for hints!");
    return;
  }
  const choice = empties[Math.floor(Math.random() * empties.length)];
  choice.input.value = solution[choice.r][choice.c];
  choice.cellDiv.classList.add("hint");
  setTimeout(() => choice.cellDiv.classList.remove("hint"), 1500);
}

// Reset puzzle inputs to original state
function resetPuzzle() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cellIndex = r * 9 + c;
      const cellDiv = board.children[cellIndex];
      const input = cellDiv.querySelector("input");
      if (!input.disabled) {
        input.value = "";
        clearCellStyles(cellDiv);
      }
    }
  }
  startTimer();
}

// Save current game state to localStorage
function saveGame() {
  let currentState = [];
  for (let r = 0; r < 9; r++) {
    currentState[r] = [];
    for (let c = 0; c < 9; c++) {
      const cellIndex = r * 9 + c;
      const cellDiv = board.children[cellIndex];
      const input = cellDiv.querySelector("input");
      currentState[r][c] = input.value ? parseInt(input.value, 10) : 0;
    }
  }
  localStorage.setItem("sudoku-puzzle", JSON.stringify(puzzle));
  localStorage.setItem("sudoku-solution", JSON.stringify(solution));
  localStorage.setItem("sudoku-state", JSON.stringify(currentState));
  localStorage.setItem("sudoku-timer", timer);
  alert("Game saved!");
}

// Load game state from localStorage
function loadGame() {
  const savedPuzzle = JSON.parse(localStorage.getItem("sudoku-puzzle"));
  const savedSolution = JSON.parse(localStorage.getItem("sudoku-solution"));
  const savedState = JSON.parse(localStorage.getItem("sudoku-state"));
  const savedTimer = parseInt(localStorage.getItem("sudoku-timer"), 10);

  if (savedPuzzle && savedSolution && savedState) {
    puzzle = savedPuzzle;
    solution = savedSolution;
    renderBoard(puzzle);
    // Fill inputs with savedState
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] === 0) {
          const cellIndex = r * 9 + c;
          const cellDiv = board.children[cellIndex];
          const input = cellDiv.querySelector("input");
          input.value = savedState[r][c] || "";
          clearCellStyles(cellDiv);
        }
      }
    }
    if (!isNaN(savedTimer)) {
      timer = savedTimer;
      timerDisplay.textContent = `${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 60).padStart(2, "0")}`;
      clearInterval(interval);
      interval = setInterval(() => {
        timer++;
        const minutes = String(Math.floor(timer / 60)).padStart(2, "0");
        const seconds = String(timer % 60).padStart(2, "0");
        timerDisplay.textContent = `${minutes}:${seconds}`;
      }, 1000);
    } else {
      startTimer();
    }
    alert("Game loaded!");
  } else {
    alert("No saved game found!");
  }
}

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle("dark");
  // Store preference
  if(document.body.classList.contains("dark")){
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
}

// On load, check theme preference
function loadTheme() {
  const theme = localStorage.getItem("theme");
  if(theme === "dark"){
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

function startNewGame() {
  stopTimer();
  const fullBoard = generateFullBoard();
  solution = deepCopy(fullBoard);
  puzzle = removeCells(fullBoard, difficultySelect.value);
  renderBoard(puzzle);
  startTimer();
}

newGameBtn.addEventListener("click", startNewGame);
checkBtn.addEventListener("click", checkSolution);
resetBtn.addEventListener("click", resetPuzzle);
hintBtn.addEventListener("click", giveHint);
saveBtn.addEventListener("click", saveGame);
loadBtn.addEventListener("click", loadGame);
themeToggle.addEventListener("click", toggleTheme);

// Initialize
loadTheme();
startNewGame();
