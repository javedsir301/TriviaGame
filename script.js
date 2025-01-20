const setupDisplay = document.getElementById('mainScreen');
const displayAllCategories = document.getElementById('categoriesScreen');
const displayQuestions = document.getElementById('displayQuestion');
const postCategories = document.getElementById('postCatScreen');
const gameOver = document.getElementById('gameOver');

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('newCatBtn').addEventListener('click', () => displayScreens(displayAllCategories));
document.getElementById('endGameBtn').addEventListener('click', endGame);
document.getElementById('newGameStart').addEventListener('click', resetGame);

let gameStatus = {
    players: [],
    currentPlayer: 0,
    currentCategory: '',
    questions: [],
    currentQuestionIndex: 0,
    usedCategories: []
};

const BASE_URL = 'https://the-trivia-api.com/v2/questions';

function startGame() {
    const firstPlayerName = document.getElementById('firstPlayer').value;
    const secondPlayerName = document.getElementById('secondPlayer').value;

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

function displayScreens(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

async function fetchCategories() {
    try {
        const response = await fetch(`${BASE_URL}?limit=20`);
        const data = await response.json();
        const categories = [...new Set(data.map(question => question.category))];
        displayCategories(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        showResult('Failed to fetch categories. Please try again.');
    }
}

function displayCategories(categories) {
    const catList = document.getElementById('categorieslist');
    catList.innerHTML = '';
    categories.forEach(category => {
        if (!gameStatus.usedCategories.includes(category)) {
            const button = document.createElement('button');
            button.textContent = category;
            button.addEventListener('click', () => selectCategory(category));
            catList.appendChild(button);
        }
    });

    if (gameStatus.usedCategories.length === categories.length) {
        endGame();
    }
}

async function selectCategory(category) {
    gameStatus.currentCategory = category;
    gameStatus.usedCategories.push(category);
    await fetchQuestions(category);
    startQuestionRound();
}

async function fetchQuestions(category) {
    try {
        const response = await fetch(`${BASE_URL}?categories=${category}&limit=6`);
        let questions = await response.json();
        questions = questions.filter(q => q.difficulty);
        gameStatus.questions = groupQuestionsByDifficulty(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        showResult('Failed to fetch questions. Please try again.');
    }
}

function groupQuestionsByDifficulty(questions) {
    let grouped = {
        easy: [],
        medium: [],
        hard: []
    };

    questions.forEach(q => {
        if (grouped[q.difficulty]) {
            grouped[q.difficulty].push(q);
        }
    });
    return [
        ...grouped.easy.slice(0, 2),
        ...grouped.medium.slice(0, 2),
        ...grouped.hard.slice(0, 2),
    ];
}

function startQuestionRound() {
    gameStatus.currentQuestionIndex = 0;
    displayQuestion();
}

function displayQuestion() {
    const question = gameStatus.questions[gameStatus.currentQuestionIndex];
    const currentPlayer = gameStatus.players[gameStatus.currentPlayer];

    document.getElementById('currentQues').textContent = `${currentPlayer.name}'s Turn`;
    document.getElementById('q-text').textContent = question.question.text;

    const options = document.getElementById('allOptions');
    options.innerHTML = '';

    const allAnswers = [question.correctAnswer, ...question.incorrectAnswers];
    shuffleArray(allAnswers);

    allAnswers.forEach(answer => {
        const button = document.createElement('button');
        button.textContent = answer;
        button.addEventListener('click', () => handleAnswer(answer, question));
        options.appendChild(button);
    });

    displayScreens(displayQuestions);
}

function handleAnswer(answer, question) {
    const currentPlayer = gameStatus.players[gameStatus.currentPlayer];
    document.querySelectorAll('#allOptions button').forEach(button => button.disabled = true);

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

function nextQuestion() {
    gameStatus.currentQuestionIndex++;

    if (gameStatus.currentQuestionIndex < gameStatus.questions.length) {
        displayQuestion();
    } else {
        displayScreens(postCategories);
        const lastCategory = gameStatus.currentCategory;
        const categoryButton = [...document.querySelectorAll('#categorieslist button')]
            .find(button => button.textContent === lastCategory);
        if (categoryButton) {
            categoryButton.disabled = true;
        }
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

function endGame() {
    const firstPlayer = gameStatus.players[0];
    const secondPlayer = gameStatus.players[1];

    const scores = document.getElementById('totalScores');
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
