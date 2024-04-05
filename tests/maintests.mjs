import { strictEqual, fail } from 'assert';
import { MongoClient } from 'mongodb';
import axios from 'axios';

const create = axios.create;
const myurl = 'http://localhost:3000';
const databaseUrl = 'mongodb://localhost:27017';
const dbName = 'users-db';

const instance = create({
  baseURL: myurl,
  timeout: 99999999,
  headers: { 'content-type': 'application/json' }
});

let db;
let client;
let adminUsername;
let username = 'turjo';
let password = 'pass';
let adminCode = '1234';
let gameId;
let stockSymbol = 'AAPL';
let quantity = 5;

before(async function () {
  client = new MongoClient(databaseUrl);
  await client.connect();
  db = client.db(dbName);

  // Register and setup user and admin for initial tests
  await instance.post('/users/register', { username: 'user', password: 'pass' }).catch(() => { });
  
  // Global setup for game and portfolio operations
  await instance.post('/users/register', { username, password });
  await instance.post('/users/adminDelaration', { username, code: adminCode });
  const gameCreationResponse = await instance.post('/game/create', {
    adminUsername: username,
    startingBalance: 3000,
    maxPlayers: 5
  });
  gameId = gameCreationResponse.data.gameId;
});

after(async function () {
  await db.collection('users').deleteMany({});
  await db.collection('games').deleteMany({});
  await db.collection('portfolios').deleteMany({});
  await client.close();
});


describe('Application Features', function () {
    describe('1.User Registration Feature', function () {
      it('Successfully registers a new user', async function () {
        const userData = { username: 'newUser', password: 'newPass' };
        const response = await instance.post('/users/register', userData);
        strictEqual(response.status, 200);
      });

      it('Fails to register a user with an existing username', async function () {
        const userData = { username: 'user', password: 'pass' };
        try {
          await instance.post('/users/register', userData);
        } catch (error) {
          strictEqual(error.response.status, 400);
          strictEqual(error.response.data, 'Error. User not registered in the database.');
        }
      });

      it('Verifies that user is correctly saved in the database', async function () {
        const username = 'newUser';
        const user = await db.collection('users').findOne({ username });
        strictEqual(user.username, username, 'User is not saved in the database as expected');
      });
    });


    describe('2.User Login Feature', function () {
      it('Fails to login with an incorrect username', async function () {
        const loginData = { username: 'noUser', password: 'pass' };
        try {
          await instance.post('/users/login', loginData);
        } catch (error) {
          strictEqual(error.response.status, 400);
          strictEqual(error.response.data, 'Invalid username or password.');
        }
      });

      it('Fails to login with an incorrect password', async function () {
        const loginData = { username: 'user', password: 'wrongPassword' };
        try {
          await instance.post('/users/login', loginData);
        } catch (error) {
          strictEqual(error.response.status, 400);
          strictEqual(error.response.data, 'Invalid username or password.');
        }
      });

      it('Successfully logs in with the correct username and password', async function () {
        const loginData = { username: 'user', password: 'pass' };
        const response = await instance.post('/users/login', loginData);
        strictEqual(response.status, 200);
      });
    });


    describe('3.Game Creation Authorization', function () {
      it('Fails to create a game with a regular user', async function () {
        const gameData = {
          adminUsername: adminUsername,
          startingBalance: 3000,
          maxPlayers: 5
        };
        try {
          await instance.post('/game/create', gameData);
          fail('Expected an error when creating a game without admin privileges');
        } catch (error) {
          strictEqual(error.response.status, 403);
          strictEqual(error.response.data, 'Only admins can create games.');
        }
      });

      it('Promotes user to admin', async function () {
        const adminData = { username: 'user', code: '1234' };
        const response = await instance.post('/users/adminDelaration', adminData);
        strictEqual(response.status, 200);
        adminUsername = adminData.username;
      });

      it('Successfully creates a game with an admin user', async function () {
        const gameData = {
          adminUsername: adminUsername,
          startingBalance: 3000,
          maxPlayers: 5
        };

        const response = await instance.post('/game/create', gameData);
        strictEqual(response.status, 201);
        strictEqual(response.data.message, 'Game created successfully.');
      });
    });
  

    describe('4.Strating cash check up for general and game context', function() {
        it('Allows a user to join a game', async function() {
        const joinResponse = await instance.post('/game/join', { username, gameId });
        strictEqual(joinResponse.status, 200, 'User should successfully join the game');
        });

        it('Verifies initial cash in general portfolio', async function() {
        const response = await instance.get(`/portfolio/${username}`);
        strictEqual(response.status, 200);
        strictEqual(response.data.cash, 10000, 'Initial cash in general portfolio is incorrect');
        });

        it('Verifies initial cash in joined game', async function() {
        const response = await instance.get(`/portfolio/${username}`);
        const gameInfo = response.data.games.find(game => game.gameId === gameId);
        strictEqual(gameInfo.balance, 3000, 'Initial cash in joined game is incorrect');
        });
    });

    describe('5.Portfolio Buy and Sell Features', function() {
        it('Allows a user to buy stock generally', async function() {
        await instance.post('/portfolio/buy', { username, symbol: stockSymbol, quantity });
        const response = await instance.get(`/portfolio/${username}`);
        const stockEntry = response.data.assets.find(asset => asset.symbol === stockSymbol);
        strictEqual(stockEntry.quantity, quantity, 'Stock quantity in general portfolio after purchase is incorrect');
        });

        it('Allows a user to sell stock generally', async function() {
        await instance.post('/portfolio/sell', { username, symbol: stockSymbol, quantity });
        const response = await instance.get(`/portfolio/${username}`);
        const stockEntry = response.data.assets ? response.data.assets.find(asset => asset.symbol === stockSymbol) : undefined;
        strictEqual(stockEntry, undefined, 'Stock should be sold from the general portfolio');
        });

        it('Allows a user to buy stock within a game', async function() {
        await instance.post('/portfolio/buy', { username, symbol: stockSymbol, quantity, gameId });
        const portfolioResponse = await instance.get(`/portfolio/${username}`);
        const gameInfo = portfolioResponse.data.games.find(game => game.gameId === gameId);
        const stockEntry = gameInfo.assets.find(asset => asset.symbol === stockSymbol);
        strictEqual(stockEntry.quantity, quantity, 'Stock quantity in game-specific portfolio after purchase is incorrect');
        });

        it('Allows a user to sell stock within a game', async function() {
        await instance.post('/portfolio/sell', { username, symbol: stockSymbol, quantity, gameId });
        const portfolioResponse = await instance.get(`/portfolio/${username}`);
        const gameInfo = portfolioResponse.data.games.find(game => game.gameId === gameId);
        const stockEntry = gameInfo.assets ? gameInfo.assets.find(asset => asset.symbol === stockSymbol) : undefined;
        strictEqual(stockEntry, undefined, 'Stock should be sold from the game-specific portfolio');
        });
    });
    describe('6.Player Portfolio Tracking', function() {
        it('Verify Portfolio Retrieval for a Registered User', async function() {
        const response = await instance.get(`/portfolio/${username}`);
        strictEqual(response.status, 200, 'Failed to retrieve portfolio for registered user');
        });
  
        it('Verify Portfolio Valuation After Transactions', async function() {
        const response = await instance.get(`/portfolio/${username}`);
        strictEqual(response.status, 200, 'Failed to retrieve portfolio after transactions');
        });
  
        it('Handle Non-Existent User Portfolio', async function() {
            try {
            await instance.get('/portfolio/nonExistentUser');
            throw new Error('Expected to fail for non-existent user but succeeded');
            } catch (error) {
            strictEqual(error.response.status, 404, 'Incorrect response for non-existent user portfolio');
            }
        });
    });
  
    describe('7.Transaction History', function() {
        it('Retrieves transaction history for a valid user', async function() {
        const response = await instance.get(`/portfolio/${username}/transactions`);
        strictEqual(response.status, 200, 'Failed to retrieve transaction history');
        strictEqual(Array.isArray(response.data), true, 'Transaction history is not an array');
        });
  
        it('Handles request for non-existent user', async function() {
        const response = await instance.get('/portfolio/nonExistentUser/transactions').catch(error => error.response);
        strictEqual(response.status, 404, 'Incorrect response for non-existent user');
        });
    });

    describe('8.Game Ending And Declare Winner Functionality', function() {
        it('Ends a game successfully as an admin user and verifies the winner', async function() {
        const gameEndData = { adminUsername, gameId };
        const endGameResponse = await instance.post('/game/end', gameEndData);
        strictEqual(endGameResponse.status, 200);
  
        const { winner } = endGameResponse.data;
        strictEqual(winner, username);
        });
  
        it('Fails to end a game with a non-admin user', async function() {
        const nonAdminUsername = 'nonAdminUser';
        const gameEndData = { adminUsername: nonAdminUsername, gameId };
        try {
            await instance.post('/game/end', gameEndData);
            throw new Error();
        } catch (error) {
            strictEqual(error.response.status, 403);
        }
        });
  
        it('Handles ending a non-existent or already ended game', async function() {
        const nonExistentGameId = 'nonExistentGameId';
        try {
            await instance.post('/game/end', { adminUsername, gameId: nonExistentGameId });
            throw new Error();
        } catch (error) {
            strictEqual(error.response.status, 500);
        }
        });
    });
    describe('9.Change Password', function() {
        it('Successfully changes the password', async function() {
        const response = await instance.post('/users/change-password', { username: 'turjo', oldPassword: 'pass', newPassword: 'newpass' });
        strictEqual(response.status, 200);
        });
  
        it('Fails to change password with incorrect current password', async function() {
        const response = await instance.post('/users/change-password', { username: 'turjo', oldPassword: 'wrong', newPassword: 'newpass' }).catch(error => error.response);
        strictEqual(response.status, 500);
        strictEqual(response.data, 'Password change failed.');
        });
    });
});


