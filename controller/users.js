import { User } from '../model/user.mjs';
import { Portfolio } from '../model/portfolio.mjs';

//user register controller function 
export async function registerUser(req, res) {
    try {
        const { username, password } = req.body;
        const newUser = new User(username, password);
        const message = await newUser.save();
        // Save the new user
        await new Portfolio(username).save();
        res.redirect('/login.html?registered=true');
    } catch (error) {
        console.log(error.message);
        res.status(400).send('Error. User not registered in the database.');
    }
}

//login user controller function
export async function loginUser(req, res) {
    try {
        const { username, password } = req.body;
        // Validate the user credentials
        const message = await User.validateLogin(username, password);
        res.redirect('/protfolio.html?login=true');
    } catch (error) {
        console.log(error.message);
        res.status(400).send('Invalid username or password.');
    }
}

// delacare a user admin controller function
const mastercode = 1234;
export async function adminDelaration(req,res){
    const { username, code } = req.body;
    if (code != mastercode ){
        return res.status(403).send('Incorrect admin passcode.');
    }
    try {
        // Set the user as admin
        await User.setAdmin(username, true);
        res.redirect('/login.html?adminGranted=true');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating user admin status.');
    }  
}

// changing password controller function
export async function changePassword(req, res) {
    const { username, oldPassword, newPassword } = req.body;
    try {
        const userData = await User.findByUsername(username);
        if (!userData) {
            return res.status(404).send('User not found.');
        }
        const user = new User(userData.username, userData.password);
        // Change user password
        await user.changePassword(oldPassword, newPassword);
        res.redirect('/login.html?success=true');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Password change failed.');
    }
}
