import { getDb } from '../utils/db.mjs';
import { ObjectId } from 'mongodb';

class Portfolio {
    constructor(username,  cash = 10000, assets = [], transactions = [],games = []) {
        this.username = username;
        this.cash =cash;
        this.assets = assets; 
        this.valuation = cash;
        this.transactions = transactions;
        this.games = games;
    }

    // Method for saving the portfolio
    async save() {
        const db = await getDb();
        await db.collection('portfolios').insertOne({ username: this.username, cash: this.cash, assets: this.assets });
    }

     // method for finding  portfolio by username
    static async findByUsername(username) {
        const db = await getDb();
        const portfolioData = await db.collection('portfolios').findOne({ username });
        if (!portfolioData) {
            return null; 
        } 
        const portfolio = new Portfolio(portfolioData.username, portfolioData.cash, portfolioData.assets,portfolioData.transactions,portfolioData.games);
        return portfolio;
    }

     // Method for buy stock
    async buyStock(symbol, quantity, price, gameId = null) {
        if (gameId) {
            const gameIndex = this.games.findIndex(g => g.gameId.equals(new ObjectId(gameId)));
            if (gameIndex > -1) {
                const game = this.games[gameIndex];
                const stockIndex = game.assets.findIndex(asset => asset.symbol === symbol);
                if (stockIndex > -1) {
                    game.assets[stockIndex].quantity += quantity;
                } else {
                    game.assets.push({ symbol, quantity });
                }
                game.balance -= price * quantity;
                game.valuation -= price * quantity; 
            } else {
                throw new Error('Game not found in portfolio');
            }
        } else {
            const stockIndex = this.assets.findIndex(asset => asset.symbol === symbol);
            if (stockIndex > -1) {
                this.assets[stockIndex].quantity += quantity;
            } else {
                this.assets.push({ symbol, quantity });
            }
            this.cash -= price * quantity;
        }
        this.transactions.push({
            type: 'buy',
            symbol,
            quantity,
            price,
            date: new Date(),
            gameId: gameId 
        });
        await this.update();
    }
    
    // Method for sell stock
    async sellStock(symbol, quantity, price, gameId = null) {
        if (gameId) {
            const gameIndex = this.games.findIndex(g => g.gameId.equals(new ObjectId(gameId)));
            if (gameIndex > -1) {
                const game = this.games[gameIndex];
                const stockIndex = game.assets.findIndex(asset => asset.symbol === symbol);
                if (stockIndex === -1 || game.assets[stockIndex].quantity < quantity) {
                    throw new Error('Not enough shares to sell');
                }
                game.assets[stockIndex].quantity -= quantity;
                if (game.assets[stockIndex].quantity === 0) {
                    game.assets.splice(stockIndex, 1);
                }
                game.balance += price * quantity;
                game.valuation += price * quantity; 
            } else {
                throw new Error('Game not found in portfolio');
            }
        } else {
            const stockIndex = this.assets.findIndex(asset => asset.symbol === symbol);
            if (stockIndex === -1 || this.assets[stockIndex].quantity < quantity) {
                throw new Error('Not enough shares to sell');
            }
            this.assets[stockIndex].quantity -= quantity;
            if (this.assets[stockIndex].quantity === 0) {
                this.assets.splice(stockIndex, 1);
            }
            this.cash += price * quantity;
        }
        this.transactions.push({
            type: 'sell',
            symbol,
            quantity,
            price,
            date: new Date(),
            gameId: gameId 
        });
        await this.update();
    }

     // Method for calculate portfolio valuation
    async calculateValuation(currentStockPriceFunc, gameId = null) {
        let stockValuation = 0;
        let cash;
        if (gameId) {
            const gameIndex = this.games.findIndex(g => g.gameId.toString() === gameId.toString());
            if (gameIndex === -1) {
                throw new Error('Game not found in portfolio');
            }
            const game = this.games[gameIndex];
    
            for (const asset of game.assets) {
                const currentPrice = await currentStockPriceFunc(asset.symbol);
                stockValuation += currentPrice * asset.quantity;
            }
            game.valuation = game.balance + stockValuation;
            this.games[gameIndex] = game;
        } else {
            cash = this.cash;
            for (const asset of this.assets) {
                const currentPrice = await currentStockPriceFunc(asset.symbol);
                stockValuation += currentPrice * asset.quantity;
            }
            this.valuation = cash + stockValuation;
        }
        await this.update();
    }
    
    // Method for updating portfolio
    async update() {
        const db = await getDb();
        await db.collection('portfolios').updateOne({ username: this.username }, { $set: this });
    }

    // Method for join game
    async joinGame(gameId, initialBalance, assets, valuation) {
        this.games.push({
            gameId: gameId,
            balance: initialBalance,
            assets: assets,
            valuation : valuation
        });
        await this.update(); 
    }
}
export { Portfolio };