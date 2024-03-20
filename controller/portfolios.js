import { Portfolio } from '../model/portfolio.mjs';
import { currentStockPrice } from '../utils/stockPrice.mjs';

// Get portfolio Controller function
export async function getPortfolio(req, res) {
    try {
        const username = req.params.username;
        const portfolio = await Portfolio.findByUsername(username);
        if (!portfolio) {
            return res.status(404).send('Portfolio not found.');
        }

        // Calculate valuation of the portfolio using current stock prices
        await portfolio.calculateValuation(currentStockPrice);
        res.json(portfolio);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching the portfolio.');
    }
}

// buy stock Controller function
export async function buyStock(req, res) {
    try {
        const { username, symbol, quantity, gameId } = req.body; 
        // Get the current stock price
        const price = await currentStockPrice(symbol); 
        const portfolio = await Portfolio.findByUsername(username);
        if (!portfolio) {
            return res.status(404).send('Portfolio not found.');
        }
        await portfolio.buyStock(symbol, quantity, price, gameId);
        await portfolio.calculateValuation(currentStockPrice,gameId);
        // Update the portfolio
        await portfolio.update();
        res.send(`${quantity} shares of ${symbol} bought successfully.`);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during the buy transaction.');
    }
}

//sell stock Controller function
export async function sellStock(req, res) {
    try {
        const { username, symbol, quantity ,gameId} = req.body;
        // Get the current stock price
        const price = await currentStockPrice(symbol);
        const portfolio = await Portfolio.findByUsername(username);
        if (!portfolio) {
            return res.status(404).send('Portfolio not found.');
        }
        await portfolio.sellStock(symbol, quantity, price,gameId);
        await portfolio.calculateValuation(currentStockPrice,gameId);
        // Update the portfolio
        await portfolio.update();
        res.send(`${quantity} shares of ${symbol} sold successfully.`);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during the sell transaction.');
    }
}

// Get transactions Controller function 
export async function getTransactions(req, res) {
    try {
        const username = req.params.username;
        const portfolio = await Portfolio.findByUsername(username);
        if (!portfolio) {
            return res.status(404).send('Portfolio not found.');
        }
        res.json(portfolio.transactions);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching the transaction history.');
    }
}