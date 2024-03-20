import express, { json, urlencoded } from 'express';

const app = express();
const port = 3000;


app.use(json());
app.use(urlencoded({ extended: true }));


import { connectToDB, closeDBConnection } from './utils/db.mjs';
import { registerUser, loginUser,changePassword,adminDelaration } from './controller/users.js';
import { getPortfolio,buyStock, sellStock,getTransactions} from './controller/portfolios.js';
import { createGame, endGame,joinGame } from './controller/game.js';


var server;



// Connect to the database and start the server
async function createServer() {
    try {
        await connectToDB();
        // User Routes
        app.post('/users/register', registerUser); 
        app.post('/users/login', loginUser);
        app.post('/users/change-password', changePassword);
        app.post('/users/adminDelaration',adminDelaration)
        app.get('/portfolio/:username', getPortfolio);
        app.post('/portfolio/buy', buyStock);
        app.post('/portfolio/sell', sellStock);
        app.get('/portfolio/:username/transactions', getTransactions);
        app.post('/game/create', createGame);
        app.post('/game/end', endGame);
        app.post('/game/join', joinGame);
        server = app.listen(port, () => {
            console.log('Example app listening at http://localhost:%d', port);
    });   
    } catch (err) {
        console.log(err)
    }
}

createServer();


process.on('SIGINT', () => {
    console.info('SIGINT signal received.');
    console.log('Closing Mongo Client.');
    server.close(async function(){
      let msg = await closeDBConnection()   ;
      console.log(msg);
    });
  });