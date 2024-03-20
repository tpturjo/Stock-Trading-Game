import { getDb } from "../utils/db.mjs";
import { ObjectId } from "mongodb";
import { Portfolio } from "./portfolio.mjs";
import { currentStockPrice } from "../utils/stockPrice.mjs";


class Game{
    constructor(startingBalance,maxPlayers, id = null,assets = []){
        this.startingBalance = startingBalance;
        this.maxPlayers = maxPlayers;
        this.id =id;
        this.players = [];
        this.active = true;
        this.balance = startingBalance;
        this.assets = []
        this.valuation = this.startingBalance;
    }

    // Method for save the game
    async save() {
        const db = await getDb();
        const result = await db.collection('games').insertOne({
            startingBalance: this.startingBalance,
            maxPlayers: this.maxPlayers,
            players: this.players,
            active: this.active,
            balance: this.balance,
            assets: this.assets,
            valuation: this.valuation
        });
        this.id = result.insertedId.toString(); 
        return this.id;
    }

    // method for find game by ID
    static async findById(gameId) {
        const db = await getDb();
        const game = await db.collection('games').findOne({ _id: new ObjectId(gameId) });
        return game;
    }

    // method for ending the game and declare the winner
    static async endAndWinner(gameId) {
        const db = await getDb();
        const game = await db.collection('games').findOne({ _id: new ObjectId(gameId) });
        if (!game || !game.active) {
            throw new Error('Game not found or already ended.');
        }
        let winner = null;
        let highestValuation = 0;
        // Iterate through players to find the winner
        for (const playerUsername of game.players) {
            const playerPortfolio = await Portfolio.findByUsername(playerUsername);
            await playerPortfolio.calculateValuation(currentStockPrice); 
            if (playerPortfolio.valuation > highestValuation) {
                highestValuation = playerPortfolio.valuation;
                winner = playerUsername;
            }
        }
        // Update game status
        const result = await db.collection('games').updateOne({ _id: new ObjectId(gameId) }, {
            $set: {
                active: false,
                winner: winner,
                winnerValuation: highestValuation
            }
        });
        if (result.modifiedCount === 0) {
            throw new Error('Failed to end the game.');
        }
        return {
            winner: winner,
            valuation: highestValuation
        };
    }

    // Method for adding  player to the game
    async addPlayer(username) {
        if (this.players.length >= this.maxPlayers) {
            throw new Error('Maximum number of players reached.');
        }
        if (this.players.includes(username)) {
            throw new Error('Player already joined.');
        }
        this.players.push(username);
        await this.update();
    }

    // Method for updating the game
    async update() {
        const db = await getDb();
        await db.collection('games').updateOne({ _id: new ObjectId(this.id) }, { $set: { players: this.players, active: this.active } });
    }
}
export { Game };