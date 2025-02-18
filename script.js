import Deck from "./deck.js";
// import Deck, { Card } from "./deck.js"
    // just to test for you win or you lose

const CARD_VALUE_MAP = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14
};

// DOM Elements 
const computerCardSlot = document.querySelector('.computer-card-slot');
const playerCardSlot = document.querySelector('.player-card-slot');
const computerDeckElement = document.querySelector('.computer-deck');
const playerDeckElement = document.querySelector('.player-deck')
const text = document.querySelector('.text');
const connectWalletButton = document.getElementById("connectWalletButton");
const roundDisplay = document.getElementById('roundCount');

// Smart Contract Config.
const CONTRACT_ADDRESS = ""; // Add your contract address here
const CONTRACT_ABI = []; // Add your ABI here
let contract;
let playerAccount;

// Game Variables
let playerDeck, computerDeck, inRound, stop;
let roundCounter = 0;

// Wallet Connection
async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            playerAccount = accounts[0];
            console.log("Connected Wallet:", playerAccount);

            // Init contract
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            
            // Update UI
            document.getElementById("walletAddress").innerText = `Connected: ${playerAccount}`;
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    } else {
        alert("Please install MetaMask!");
    }
}

// Start Game
function startGame() {
    const deck = new Deck();
    deck.shuffle();

    const deckMidpoint = Math.ceil(deck.numberOfCards / 2);
    playerDeck = new Deck(deck.cards.slice(0, deckMidpoint));
    computerDeck = new Deck(deck.cards.slice(deckMidpoint, deck.numberOfCards));

    inRound = false;
    stop = false;
    roundCounter = 0;

    cleanBeforeRound();
    updateRoundDisplay();
}

// Clear Board Before Round
function cleanBeforeRound() {
    inRound = false;
    computerCardSlot.innerHTML = '';
    playerCardSlot.innerHTML = '';
    text.innerText = '';
    updateDeckCount();
}

// Flip Cards & Determine Winner
async function flipCards() {
    if (stop) return;
    
    inRound = true;
    roundCounter++;
    updateRoundDisplay();

    const playerCard = playerDeck.pop();
    const computerCard = computerDeck.pop();

    if (!playerCard || !computerCard) return; // Prevents errors if a deck is empty

    playerCardSlot.appendChild(playerCard.getHTML());
    computerCardSlot.appendChild(computerCard.getHTML());

    updateDeckCount();

    if (isRoundWinner(playerCard, computerCard)) {
        text.innerText = "You Win This Round!";
        playerDeck.push(playerCard);
        playerDeck.push(computerCard);
    } else if (isRoundWinner(computerCard, playerCard)) {
        text.innerText = "You Lose This Round!";
        computerDeck.push(playerCard);
        computerDeck.push(computerCard);
    } else {
        text.innerText = "It's a Draw!";
        playerDeck.push(playerCard);
        computerDeck.push(computerCard);
    }

    // Check for game over
    if (isGameOver(playerDeck)) {
        text.innerText = "You Lose The Game!";
        stop = true;
    } else if (isGameOver(computerDeck)) {
        text.innerText = "You Win The Game!";
        stop = true;
        try {
            await declareWinner(playerAccount);
        } catch (error) {
            console.error("Failed to declare winner:", error);
        }
    }
}

// Update Deck Count Display
function updateDeckCount() {
    computerDeckElement.innerText = `Deck: ${computerDeck.numberOfCards}`;
    playerDeckElement.innerText = `Deck: ${playerDeck.numberOfCards}`;
}

// Update Round Display
function updateRoundDisplay() {
    roundDisplay.innerText = `Rounds Played: ${roundCounter}`;
}

// Determine Round Winner
function isRoundWinner(cardOne, cardTwo) {
    return CARD_VALUE_MAP[cardOne.value] > CARD_VALUE_MAP[cardTwo.value];
}

// Check If Game Over
function isGameOver(deck) {
    return deck.numberOfCards === 0;
}

// Declare Winner on Smart Contract
async function declareWinner(winnerAddress) {
    try {
        if (!contract) {
            console.error("Contract not initialized.");
            return;
        }
        const tx = await contract.declareWinner(winnerAddress);
        await tx.wait();
        console.log("Winner declared:", winnerAddress);
    } catch (error) {
        console.error("Error declaring winner:", error);
    }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", startGame);
connectWalletButton.addEventListener("click", connectWallet);
document.addEventListener('click', (event) => {
    // List of elements that should NOT trigger the game
    const excludedElements = ["connectWalletButton", "startGameButton", "wagerAmount"];

    if (excludedElements.includes(event.target.id)) {
        return; // Prevent game start if clicking these elements
    }

    if (stop) {
        startGame();
    } else if (inRound) {
        cleanBeforeRound();
    } else {
        flipCards();
    }
});
