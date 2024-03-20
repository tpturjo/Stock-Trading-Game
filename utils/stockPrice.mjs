import axios from 'axios';

const apiKey = "odJr45ZZFM4cuEjXWIdaHHh6FlgSRf9F"; 
const baseUrl = 'https://financialmodelingprep.com/api/v3';

// Function to fetch the latest stock price
export async function currentStockPrice(stockSymbol) {
    const url = `${baseUrl}/quote/${stockSymbol}?apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        if(response.data && response.data.length > 0) {
            const stockData = response.data[0];
            const price = stockData.price;
            return price;
        } else {
            console.error('No data found for symbol:', stockSymbol);
            return null;
        }
    } catch (error) {
        console.error('Error fetching current stock price for', stockSymbol, error);
        throw error;
    }
}
