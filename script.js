// DOM Elements
const setupDisplay = document.getElementById('setup');
const displayAllCategories = document.getElementById('categories');
const displayQuestions = document.getElementById('question');
const postCategories = document.getElementById('post-cat');
const gameOver = document.getElementById('game-over');

// Event Listeners
document.getElementById('start').addEventListener('click', startGame);
document.getElementById('new-cat').addEventListener('click', () => displayScreens(displayAllCategories));
document.getElementById('end').addEventListener('click', endGame);
document.getElementById('new-game').addEventListener('click', resetGame);

// Game state
let gameStatus = {
    players: [],
    currentPlayer: 0,
    currentCategory: '',
    questions: [],
    currentQuestionIndex: 0,
    usedCategories: []
};

// API endpoint
const BASE_URL = 'https://the-trivia-api.com/v2/questions';

// Game Initialization
function startGame() {
    const firstPlayerName = document.getElementById('first-player').value;
    const secondPlayerName = document.getElementById('second-player').value;

    if (!firstPlayerName || !secondPlayerName) {
        alert('Please enter names for both players');
        return;
    }

    gameStatus.players = [
        { name: firstPlayerName, score: 0 },
        { name: secondPlayerName, score: 0 }
    ];

    displayScreens(displayAllCategories);
    fetchCategories();
}

// Utility Functions
function displayScreens(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}


// Fetch Categories
async function fetchCategories() {
    try {
        const response = await fetch(`${BASE_URL}?limit=10`);
        const data = await response.json();
        const categories = [...new Set(data.map(question => question.category))];
        displayCategories(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        showResult('Failed to fetch categories. Please try again.');
    }
}

// Display Categories
function displayCategories(categories) {
    const catList = document.getElementById('cat-list');
    catList.innerHTML = '';
    categories.forEach(category => {
        if (!gameStatus.usedCategories.includes(category)) {
            const button = document.createElement('button');
            button.textContent = category;
            button.addEventListener('click', () => selectCategory(category));
            catList.appendChild(button);
        }
    });
}

// Select Category
async function selectCategory(category) {
    gameStatus.currentCategory = category;
    gameStatus.usedCategories.push(category);
    await fetchQuestions(category);
    startQuestionRound();
}

// Fetch Questions
async function fetchQuestions(category) {
    try {
        const response = await fetch(`${BASE_URL}?categories=${category}&limit=6`);
        gameStatus.questions = await response.json();
        gameStatus.questions.sort((a, b) => {
            const difficultyOrder = { easy: 2, medium: 2, hard: 2 };
            return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        showResult('Failed to fetch questions. Please try again.');
    }
}

// Start Question Round
function startQuestionRound() {
    gameStatus.currentQuestionIndex = 0;
    displayQuestion();
}

// Display Question
function displayQuestion() {
    const question = gameStatus.questions[gameStatus.currentQuestionIndex];
    const currentPlayer = gameStatus.players[gameStatus.currentPlayer];

    document.getElementById('current').textContent = `${currentPlayer.name}'s Turn`;
    document.getElementById('q-text').textContent = question.question.text;

    const options = document.getElementById('options');
    options.innerHTML = '';

    const allAnswers = [question.correctAnswer, ...question.incorrectAnswers];
    shuffleArray(allAnswers);

    allAnswers.forEach(answer => {
        const button = document.createElement('button');
        button.textContent = answer;
        button.addEventListener('click', () => handleAnswer(answer));
        options.appendChild(button);
    });

    displayScreens(displayQuestions);
}

// Handle Answer
function handleAnswer(answer) {
    const question = gameStatus.questions[gameStatus.currentQuestionIndex];
    const currentPlayer = gameStatus.players[gameStatus.currentPlayer];

    let points = 0;
    if (answer === question.correctAnswer) {
        switch (question.difficulty) {
            case 'easy':
                points = 10;
                break;
            case 'medium':
                points = 15;
                break;
            case 'hard':
                points = 20;
                break;
        }
        currentPlayer.score += points;
        showResult(`Correct! ${currentPlayer.name} earned ${points} points.`);
    } else {
        showResult(`Incorrect. The correct answer was: ${question.correctAnswer}`);
    }

    setTimeout(() => {
        nextQuestion();
    }, 2000);
}

// Next Question
function nextQuestion() {
    gameStatus.currentQuestionIndex++;
    // Switch player
    gameStatus.currentPlayer = 1 - gameStatus.currentPlayer; 
    if (gameStatus.currentQuestionIndex < gameStatus.questions.length) {
        displayQuestion();
    } else {
        displayScreens(postCategories);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function showResult(message) {
    const resultElement = document.createElement('p');
    resultElement.textContent = message;
    resultElement.classList.add('result');
    displayQuestions.appendChild(resultElement);

    setTimeout(() => {
        resultElement.remove();
    }, 2000);
}

// End Game
function endGame() {
    const firstPlayer = gameStatus.players[0];
    const secondPlayer = gameStatus.players[1];

    const scores = document.getElementById('scores');
    scores.innerHTML = `
        <p>${firstPlayer.name}: ${firstPlayer.score} points</p>
        <p>${secondPlayer.name}: ${secondPlayer.score} points</p>
    `;

    const winner = document.getElementById('winner');
    if (firstPlayer.score > secondPlayer.score) {
        winner.textContent = `${firstPlayer.name} wins!`;
    } else if (secondPlayer.score > firstPlayer.score) {
        winner.textContent = `${secondPlayer.name} wins!`;
    } else {
        winner.textContent = "It's a tie!";
    }

    displayScreens(gameOver);
}


// Reset Game
function resetGame() {
    gameStatus = {
        players: [],
        currentPlayer: 0,
        currentCategory: '',
        questions: [],
        currentQuestionIndex: 0,
        usedCategories: []
    };
    displayScreens(setupDisplay);
}
