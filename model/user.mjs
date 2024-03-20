import { getDb } from '../utils/db.mjs';
import bcrypt from 'bcrypt';

async function _get_users_collection (){
    let db = await getDb();
    return await db.collection('users');
};


class User {
    constructor(username, password, isAdmin = false){
        this.username = username;
        this.password = password;
        this.isAdmin = isAdmin;
    }

    //method to find a user by username
    static async findByUsername(username) {
        let collection = await _get_users_collection();
        const userfind = await collection.findOne({ username: username });
        if (!userfind) {
            return null;
        }
        return new User(userfind.username,userfind.password,userfind.isAdmin);
    }

    // Method to save the user
    async save(){
        const saltRounds = 10;
        let collection = await _get_users_collection();
        const hashedPassword = await bcrypt.hash(this.password, saltRounds);
        const existingUser = await collection.findOne({ username: this.username });
        if (existingUser) {
            throw new Error('User already exists');
        }
        const result = await collection.insertOne({ username: this.username,  password: hashedPassword });
        console.log('User was inserted in the database with id -> '+ result.insertedId);
        return 'User registered successfully.';
    }
    
    // method to validate user
    static async validateLogin(username, password){
        let collection = await _get_users_collection();
        const user = await collection.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            return 'User logged in successfully.';
        } else {
            throw new Error('Invalid username or password');
        }}

    //method to set admin
    static async setAdmin(username, isAdmin) {
        const db = await getDb();
        const result = await db.collection('users').updateOne({ username }, { $set: { isAdmin } });
        if (result.modifiedCount === 0) {
            console.log(`No user found with username ${username} or admin status not updated.`);
        } else {
         console.log(`Admin status updated for user ${username}.`);
        }
    }

    // Method to change  password
    async changePassword(oldPassword, newPassword) {
        const match = await bcrypt.compare(oldPassword, this.password);
        if (!match) {
            throw new Error('Current password is incorrect.');
        }
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(newPassword, salt);
        let collection = await _get_users_collection();
        await collection.updateOne({ username: this.username }, { $set: { password: this.password } });
        return 'Password changed successfully.';
    }    
}
const _Users = User;
export { _Users as User };