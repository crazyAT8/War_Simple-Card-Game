import Deck from "./deck.js";
// import Deck, { Card } from "./deck.js"
    // just to test for you win or you lose

const CARD_VALUE_MAP = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14
}

// DOM Elements 
const computerCardSlot = document.querySelector('.computer-card-slot ');
const playerCardSlot = document.querySelector('.player-card-slot');
const computerDeckElement = document.querySelector('.computer-deck');
const playerDeckElement = document.querySelector('.player-deck')
const text = document.querySelector('.text');

let playerDeck, computerDeck, inRound, stop;

// Smart Contract Config.
const CONTRACT_ADDRESS = "";
const CONTRACT_ABI = [/* ABI array here */];
let contract;
let playerAccount;

async function connectWallet() {
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        playerAccount = accounts[0];
        console.log("Connected Wallet:", playerAccount);

        // Init contract
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    } else {
        alert("Please install MetaMask!");
    }
}

// Init Game
document.addEventListener('click', async () => {
    if (stop) {
        startGame()
        return;
    }

    if (inRound) {
        cleanBeforeRound()
    } else {
        flipCards()
    }
});

connectWallet(); // wallet needs to connect on the page load
startGame();

function startGame() {
    const deck = new Deck();
    deck.shuffle();

    const deckMidpoint = Math.ceil(deck.numberOfCards / 2);
    playerDeck = new Deck(deck.cards.slice(0, deckMidpoint));
    computerDeck = new Deck(deck.cards.slice(deckMidpoint, deck.numberOfCards));
    // computerDeck = new Deck([new Card("s", 2)]);
    // just to test for you win or you lose

    inRound = false;
    stop = false;

    // console.log(playerDeck)
    // console.log(computerDeck)

    cleanBeforeRound()
}

function cleanBeforeRound() {
    inRound =false;
    computerCardSlot.innerHTML = '';
    playerCardSlot.innerHTML = '';
    text.innerText = '';

    updateDeckCount()
}

async function flipCards() {
    inRound = true;

    const playerCard = playerDeck.pop();
    const computerCard = computerDeck.pop();

    playerCardSlot.appendChild(playerCard.getHTML());
    computerCardSlot.appendChild(computerCard.getHTML());

    updateDeckCount()

    if (isRoundWinner(playerCard, computerCard)) {
        text.innerText = "Win";
        playerDeck.push(playerCard);
        playerDeck.push(computerCard);
    } else if (isRoundWinner(computerCard, playerCard)) {
        text.innerText = "Lose";
        computerDeck.push(playerCard);
        computerDeck.push(computerCard);
    } else {
        text.innerText = "Draw";
        playerDeck.push(playerCard);
        computerDeck.push(computerCard);
    }

    if (isGameOver(playerDeck)) {
        text.innerText = "You Lose!!";
        stop = true;
    } else if (isGameOver(computerDeck)) {
        text.innerText = "You Win!!";
        stop = true;
        await declareWinner(playerAccount);
    }
}

function updateDeckCount() {
    computerDeckElement.innerText = computerDeck.numberOfCards;
    playerDeckElement.innerText = playerDeck.numberOfCards;
}

function isRoundWinner(cardOne, cardTwo) {
    return CARD_VALUE_MAP[cardOne.value] > CARD_VALUE_MAP[cardTwo.value]
}

function isGameOver(deck) {
    return deck.numberOfCards === 0
}


// computerCardSlot.appendChild(deck.cards[0].getHTML())

// Declare Winner on Smart Contract
async function declareWinner(winnerAddress) {
    try {
        const tx = await contract.declareWinner(winnerAddress);
        await tx.wait();
        console.log("Winner declared:", winnerAddress);
    } catch (error) {
        console.error("Error declaring winner:", error);
    }
}

let playerDeck, computerDeck, inRound, stop;
let roundCounter = 0; // Initialize round counter

document.addEventListener('click', () => {
    if (stop) {
        startGame();
        return;
    }

    if (inRound) {
        cleanBeforeRound();
    } else {
        flipCards();
    }
});

startGame();

function startGame() {
    const deck = new Deck();
    deck.shuffle();

    const deckMidpoint = Math.ceil(deck.numberOfCards / 2);
    playerDeck = new Deck(deck.cards.slice(0, deckMidpoint));
    computerDeck = new Deck(deck.cards.slice(deckMidpoint, deck.numberOfCards));

    inRound = false;
    stop = false;
    roundCounter = 0; // Reset the round counter

    cleanBeforeRound();
    updateRoundDisplay();
}

function cleanBeforeRound() {
    inRound = false;
    computerCardSlot.innerHTML = '';
    playerCardSlot.innerHTML = '';
    text.innerText = '';

    updateDeckCount();
}

function flipCards() {
    inRound = true;
    roundCounter++; // Increment round counter
    updateRoundDisplay(); // Update round display

    const playerCard = playerDeck.pop();
    const computerCard = computerDeck.pop();

    playerCardSlot.appendChild(playerCard.getHTML());
    computerCardSlot.appendChild(computerCard.getHTML());

    updateDeckCount();

    if (isRoundWinner(playerCard, computerCard)) {
        text.innerText = "Win";
        playerDeck.push(playerCard);
        playerDeck.push(computerCard);
    } else if (isRoundWinner(computerCard, playerCard)) {
        text.innerText = "Lose";
        computerDeck.push(playerCard);
        computerDeck.push(computerCard);
    } else {
        text.innerText = "Draw";
        playerDeck.push(playerCard);
        computerDeck.push(computerCard);
    }

    if (isGameOver(playerDeck)) {
        text.innerText = "You Lose!!";
        stop = true;
    } else if (isGameOver(computerDeck)) {
        text.innerText = "You Win!!";
        stop = true;
    }
}

function updateDeckCount() {
    computerDeckElement.innerText = computerDeck.numberOfCards;
    playerDeckElement.innerText = playerDeck.numberOfCards;
}

function updateRoundDisplay() {
    const roundDisplay = document.getElementById('roundCount');
    roundDisplay.innerText = `Rounds Played: ${roundCounter}`;
}

function isRoundWinner(cardOne, cardTwo) {
    return CARD_VALUE_MAP[cardOne.value] > CARD_VALUE_MAP[cardTwo.value];
}

function isGameOver(deck) {
    return deck.numberOfCards === 0;
}
