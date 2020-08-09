//Login route
const express = require("express");
const User = require("../models/user");

const router = new express.Router();

/*
    POST /login : Authenticate a user and return a JSON Web Token which contains a payload with the username and is_admin values
*/
router.post("/", async function (req, res, next) {
    try {
        const token = await User.login(req.body.username, req.body.password);
        return res.json({token: token});
    }
    catch (e){
        return next(e)
    }
});

module.exports = router