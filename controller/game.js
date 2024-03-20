import { Game } from '../model/game.mjs';
import { Portfolio } from '../model/portfolio.mjs';
import { User } from '../model/user.mjs';
import { ObjectId } from 'mongodb';

//create game controller funtion
export async function createGame(req, res) {
    const { adminUsername, startingBalance, maxPlayers } = req.body;
    try {
        // Check if the user is an admin
        const adminUser = await User.findByUsername(adminUsername);
        if (!adminUser || !adminUser.isAdmin) {
            return res.status(403).send('Only admins can create games.');
        }
        // Create a new game instance
        const newGame = new Game(startingBalance, maxPlayers);
        await newGame.save();
        res.status(201).json({ gameId: newGame.id, message: 'Game created successfully.' });
    } catch (error) {
        res.status(500).send('Error creating the game: ' + error.message);
    }
}

// End game controller function
export async function endGame(req, res) {
    const { adminUsername, gameId } = req.body;
    try {
        // Check if the user is an admin
        const adminUser = await User.findByUsername(adminUsername);
        if (!adminUser || !adminUser.isAdmin) {
            return res.status(403).send('Unauthorized: Only admins can end games.');
        }
        // End the game and declare the winner
        const gameResult = await Game.endAndWinner(gameId);
        res.json({
            message: `Game ended successfully. Winner: ${gameResult.winner} with a valuation of ${gameResult.valuation}.`,
            ...gameResult
        })
    } catch (error) {
        console.error(error);
        res.status(500).send('Error ending the game: ' + error.message);
    }
}

// Join game controller function
export async function joinGame(req, res) {
    const { username, gameId } = req.body;
    try {
        // get game data by ID
        const gameData = await Game.findById(new ObjectId(gameId));
        if (!gameData) return res.status(404).send('Game not found.');
        if (!gameData.active) return res.status(400).send('Game is not active.');
        if (gameData.players.length >= gameData.maxPlayers) return res.status(400).send('Game has reached maximum players.');

        // Join the player to the game id
        const game = new Game(gameData.startingBalance, gameData.maxPlayers, gameData._id);
        game.players = gameData.players; 
        const portfolio = await Portfolio.findByUsername(username);
        if (!portfolio) return res.status(404).send('Portfolio not found.');
        if (portfolio.games.some(g => g.gameId.equals(game.id))) {
            return res.status(400).send('User already joined this game.');
        }
        await game.addPlayer(username);
        await portfolio.joinGame(game.id, game.balance,game.assets,game.valuation);
        res.send(`${username} joined game ${gameId} successfully.`);
    } catch (error) {
        console.error('Error joining the game:', error);
        res.status(500).send('Error joining the game.');
    }
}


