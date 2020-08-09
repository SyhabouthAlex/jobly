//Users routes
const express = require("express");
const ExpressError = require("../expressError");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jsonschema = require("jsonschema");
const newUserSchema = require("../schemas/user_schemas/newUserSchema.json");
const editUserSchema = require("../schemas/user_schemas/editUserSchema.json");
const {ensureCorrectUser} = require("../middleware/auth");

const router = new express.Router();

/*
    GET /users : Return the username, first_name, and last_name for all of the users.
*/
router.get("/", async function (req, res, next) {
    try {
        const users = await User.getAll();
        return res.json({users: users});
    } catch (err) {
        return next(err);
    }
});

/*
    POST /users : Create a new user and return the data for it after validating against jsonschema
*/
router.post("/", async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, newUserSchema);
        if (!result.valid) {
            let listOfErrors = result.errors.map(error => error.stack);
            let error = new ExpressError(listOfErrors, 400);
            return next(error);
        }
    
        const token = await User.create(req.body);
        return res.status(201).json({token: token});
    } catch (err) {
        return next(err);
    }
});

/*
    GET /users/[username] : Search for a user by their username and return the result (if it exists)
*/
router.get("/:username", async function (req, res, next) {
    try {
        const user = await User.getOne(req.params.username);
        return res.json({user: user});
    } catch (err) {
        return next(err);
    }
});

/*
    PATCH /users/[username] : Search for a user by their username and update their data based on incoming data and return the result (if it exists)
*/
router.patch("/:username", ensureCorrectUser, async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, editUserSchema);
        if (!result.valid) {
            let listOfErrors = result.errors.map(error => error.stack);
            let error = new ExpressError(listOfErrors, 400);
            return next(error);
        }
        const user = await User.update(req.params.username, req.body);
        return res.json({user: user});
    } catch (err) {
        return next(err);
    }
});

/*
    DELETE /users/[username] : Search for a user by their username and delete it (if it exists)
*/
router.delete("/:username", ensureCorrectUser, async function (req, res, next) {
    try {
        const user = await User.delete(req.params.username);
        return res.json({message: user});
    } catch (err) {
        return next(err);
    }
});
module.exports = router;