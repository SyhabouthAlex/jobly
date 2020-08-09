//User model

const db = require("../db");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const ExpressError = require("../expressError");

class User {
    static async getOne(username) {
        //Retrives information for a user from the database using their username
        const result = await db.query(
            `SELECT username, first_name, last_name, email, photo_url
            FROM users
            WHERE username = $1`,
            [username]
        );
        if (result.rows.length === 0) {
            throw { message: `There is no user with username '${username}`, status: 404 };
        };
        return result.rows[0];
    }

    static async getAll() {
        //Retrives information for all users in the database
        const result = await db.query(
            `SELECT username, first_name, last_name, email
            FROM users`
        );
        return result.rows;
    }

    static async create(data) {
        //Create a new user using incoming data
        try {
            const result = await db.query(
                `INSERT INTO users (username, password, first_name, last_name, email, photo_url)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING username, first_name, last_name, email, photo_url, is_admin`,
                [data.username, data.password, data.first_name, data.last_name, data.email, data.photo_url]
            );
            const user = result.rows[0]
            const payload = {
                username: user.username,
                is_admin: user.is_admin
            }
            return jwt.sign(payload, SECRET_KEY)
        }
        catch (e){
            if (e.constraint === "users_pkey") {
                throw { message: "That username already exists", status: 400 };
            }
            else if (e.constraint === "users_email_key") {
                throw { message: "That email already exists", status: 400 };
            }
            else {
                throw e;
            }
        }
    }

    static async update(username, data) {
        //Update an existing user using incoming data
        try {
            const result = await db.query(
                `UPDATE users
                SET password = COALESCE($1, password), first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name), 
                email = COALESCE($4, email), photo_url = COALESCE($5, photo_url)
                WHERE username = $6
                RETURNING username, first_name, last_name, email, photo_url`,
                [data.password, data.first_name, data.last_name, data.email, data.photo_url, username]
            );
            if (result.rows.length === 0) {
                throw { message: `There is no user with username '${username}`, status: 404 };
            };
            return result.rows[0];
        }
        catch (e){
            if (e.constraint === "users_email_key") {
                throw { message: "That email already exists", status: 400 };
            }
            else {
                throw e;
            }
        }
    }

    static async delete(username) {
        //Delete an exisitng user
        const result = await db.query(
            `DELETE FROM users
            WHERE username = $1
            RETURNING username`,
            [username]
        );
        if (result.rows.length === 0) {
            throw { message: `There is no user with username '${username}`, status: 404 };
        };
        return "User deleted";
    }

    static async login(username, password) {
        try {
            const result = await db.query(
                `SELECT username, password, is_admin FROM users
                WHERE username = $1`,
                [username]
            );
            const user = result.rows[0];

            if (user) {
                if (user.password === password) {
                    const payload = {
                        username: user.username,
                        is_admin: user.is_admin
                    }
                    return jwt.sign(payload, SECRET_KEY)
                }
            }
            throw new ExpressError("Invalid username/password", 400);
        }
        catch (e) {
            throw e;
        }
    }
}

module.exports = User;