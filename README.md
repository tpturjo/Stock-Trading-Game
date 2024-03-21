## Repository Layout
This repository consists of a Node.js project using Express.js to build a stock trading simulation application. The project is structured into several directories and files to organize the codebase and its functionalities:

- app.mjs: The main entry point of the application, setting up the Express server and API routes.
- controller/: Contains the controllers for users, portfolios, and game functionalities, handling the logic for API endpoints.
- model/: Includes the models for user, portfolio, and game, representing the data structure and interactions with the MongoDB database.
- utils/: Utilities and helper functions such as database connection (db.mjs) and stock price simulation (stockPrice.mjs).
- tests: A test suite for validating the application's functionality.


## Architecture Overview
The application uses a Model-View-Controller (MVC) architecture:

- Model: Defines the data structure and database operations. Models include User, Portfolio, and Game.
- View: Not implemented yet. will be on final submission. Right now unit test intrects with the app.
- Controller: Handles the application logic, interacts with models to process incoming data, and responds to client requests. Controllers are divided into users (users.js), portfolios (portfolios.js), and games (game.js).

## API/HTTP Requests & Services
### 1. User Registration Feature
- Endpoint: POST /users/register
- Request syntax: { username: 'newUser', password: 'newPass' }
- Description: This service registers a new user with a unique username and password, automatically creating a portfolio for them.
- Feature Supported: User Management
#### Unit Tests:
- Successfully registers a new user: Confirms that a new user can be registered with unique credentials.
- Fails to register a user with an existing username: Ensures the system prevents duplicate usernames from registering.
- Verifies that user is correctly saved in the database: Checks if the new user data is accurately stored in the database.
### 2. User Login Feature
- Endpoint: POST /users/login
- Request syntax:  { username: 'user', password: 'pass' }
- Description: Authenticates a user by their username and password, allowing access to their account.
- Feature Supported: Authentication
#### Unit Tests:
- Fails to login with an incorrect username: Verifies that an incorrect username prevents login.
- Fails to login with an incorrect password: Ensures that the wrong password blocks login attempts.
- Successfully logs in with the correct username and password: Confirms successful login with correct credentials.
### 3. Game Creation Authorization
- Endpoint: POST /game/create and Post /users/adminDelaration
- Request syntax: { username: 'user', code: '1234' }; for  /users/adminDelaration And  {
          adminUsername: adminUsername,
          startingBalance: 3000,
          maxPlayers: 5
        }; for /game/create 
- Description: Enables an admin user to create a new game, setting parameters like starting balance and max players.
- Feature Supported: Game Management
#### Unit Tests:
- Fails to create a game with a regular user: Ensures that only users with admin status can create games.
- Promotes user to admin: Tests the functionality that grants a user admin privileges, allowing them to create games.
- Successfully creates a game with an admin user: Validates that an admin user can successfully create a new game.
### 4. Starting Cash Check-Up for General and Game Context
- Endpoints: Implicit within POST /game/join and GET /portfolio/:username
- Request syntax: { username, gameId } for  POST /game/join and  /portfolio/${username} for GET /portfolio/:username
- Description: Ensures users have the correct starting cash in both their general portfolio and within any game they join.
- Feature Supported: Portfolio and Game Management
#### Unit Tests:
- Allows a user to join a game: Confirms a user can join a game, with the correct initial cash allocation for the game context.
- Verifies initial cash in general portfolio: Checks that the user's general portfolio starts with the correct cash amount.
- Verifies initial cash in joined game: Ensures the user's game-specific portfolio has the correct starting cash.
### 5. Portfolio Buy and Sell Features
- Endpoints: POST /portfolio/buy, POST /portfolio/sell
- Request syntax:  { username, symbol: stockSymbol, quantity }
- Description: Handles the buying and selling of stocks for a user's portfolio, affecting both general and game-specific portfolios.
- Feature Supported: Trading Operations
#### Unit Tests:
- Allows a user to buy/sell stock generally: Tests functionality for stock transactions outside of game contexts.
- Allows a user to buy/sell stock within a game: Validates stock transactions within the context of a game.
### 6. Player Portfolio Tracking
- Endpoint: GET /portfolio/:username
- Request syntax: /portfolio/${username}
- Description: Retrieves the detailed information of a user's portfolio, including assets, cash, and valuation.
- Feature Supported: Portfolio Management
#### Unit Tests:
- Verify Portfolio Retrieval for a Registered User: Ensures a user's portfolio can be accurately retrieved and displayed.
- Handle Non-Existent User Portfolio: Tests the system's response when attempting to access a portfolio for a non-existent user.
### 7. Transaction History
- Endpoint: GET /portfolio/:username/transactions
- Request syntax: /portfolio/${username}/transactions
- Description: Provides a history of all transactions made within a user's portfolio.
- Feature Supported: Portfolio Management
#### Unit Tests:
- Retrieves transaction history for a valid user: Confirms that a user's transaction history is accessible and correctly formatted.
- Handles request for non-existent user: Verifies the system's response to transaction history requests for users that do not exist.
### 8. Game Ending And Declare Winner Functionality
- Endpoint: POST /game/end
- Request syntax:{ adminUsername, gameId }
- Description: Ends a game and calculates the winner based on the final portfolio valuation of the participants.
- Feature Supported: Game Management
#### Unit Tests:
- Ends a game successfully as an admin user and verifies the winner: Tests the ability to conclude a game and declare a winner.
- Fails to end a game with a non-admin user: Ensures that only users with admin privileges can end games.
- Handles ending a non-existent or already ended game: Checks the response to attempts at ending games that cannot be found or have already concluded.
### 9. Change Password
- Endpoint:POST /users/change-password
- Request syntax:{ username: 'turjo', oldPassword: 'pass', newPassword: 'newpass' }
- Description: Allows users to update their password, given they provide the correct current password for security purposes.
- Feature Supported: Account Security
#### Unit Tests:
- Successfully changes the password: Validates the ability of users to change their password when providing the correct current password, enhancing security.
- Fails to change password with incorrect current password: Ensures the system prevents password changes when the current password provided is incorrect, maintaining account security.

Each of these features and associated endpoints play a crucial role in the functionality and user experience of the application. They cover a wide range of operations from user management and authentication to intricate game management and portfolio handling. The unit tests associated with each feature ensure that the application behaves as expected under various scenarios, maintaining data integrity, security, and a seamless user experience.

## Set up and Run server for testing
Please ensure the following packages are installed:
- axios
- bcrypt
- express
- mocha
- mongodb
- prompt-sync

Run npm install to install the dependencies. MongoDB should be active. Start the server with node app.mjs(some time it take two attempts to start).

## Running Unit Tests and Test Coverage
To run the unit tests, ensure the server is running in the background (Use two terminal). Then, execute the tests using the following command:
- npx mocha ./tests/maintests.mjs

The tests are organized into 9 main features, corresponding to the project's HTTP functionalities. With 26 tests covering all HTTP calls, all tests are currently passing, indicating that the functionalities are working as expected.
