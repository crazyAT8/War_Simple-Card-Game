// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WarGameWager {
    address public player1;
    address public player2;
    uint256 public wagerAmount;
    bool public gameStarted;

    address public winner;

    event GameInitialized(address player1, address player2, uint256 wagerAmount);
    event GameWinnerDeclared(address winner);
    event WinningsTransferred(address winner, uint256 amount);

    modifier onlyPlayers() {
        require(msg.sender == player1 || msg.sender == player2, "You are not a player in this game");
        _;
    }

    modifier gameNotStarted() {
        require(!gameStarted, "Game has already started");
        _;
    }

    modifier gameInProgress() {
        require(gameStarted, "Game has not started yet");
        _;
    }

    function initializeGame(address _player2) external payable gameNotStarted {
        require(msg.value > 0, "Wager amount must be greater than zero");
        require(player1 == address(0), "Player 1 is already set");

        player1 = msg.sender;
        player2 = _player2;
        wagerAmount = msg.value;

        gameStarted = true;

        emit GameInitialized(player1, player2, wagerAmount);
    }

    function joinGame() external payable gameInProgress {
        require(msg.sender == player2, "Only Player 2 can join");
        require(msg.value == wagerAmount, "Wager amount must match Player 1's wager");

        gameStarted = true;
    }

    function declareWinner(address _winner) external onlyPlayers gameInProgress {
        require(winner == address(0), "Winner has already been declared");
        require(_winner == player1 || _winner == player2, "Winner must be one of the players");

        winner = _winner;
        uint256 totalWager = address(this).balance;

        (bool success, ) = payable(winner).call{value: totalWager}("");
        require(success, "Transfer failed");

        emit GameWinnerDeclared(winner);
        emit WinningsTransferred(winner, totalWager);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
