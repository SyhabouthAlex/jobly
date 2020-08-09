const ExpressError = require("../expressError");
const jwt = require("jsonwebtoken");

/** Auth JWT token, add auth'd user (if any) to req. */

function authenticateJWT(req, res, next) {
    try {
      const tokenFromBody = req.body._token;
      const payload = jwt.verify(tokenFromBody, SECRET_KEY);
      req.user = payload;
      return next();
    } catch (e) {
      // error in this middleware isn't error -- continue on
      return next();
    }
}

function ensureLoggedIn(req, res, next) {
    if (!req.user) {
        const e = new ExpressError("Please log in to access this page.", 401);
        return next(err);
    }
    else {
        return next();
    }
}

function ensureCorrectUser(req, res, next) {
    if (!req.user || !req.user.username !== req.params.username) {
        const e = new ExpressError("You are not authorized to access this page.", 401);
        return next(err);
    }
    else {
        return next();
    }
}

function ensureAdmin(req, res, next) {
    if (!req.user || req.user.is_admin !== true) {
        const e = new ExpressError("You are not authorized to access this page.", 401);
        return next(err);
    }
    else {
        return next();
    }
}

module.exports = {
    authenticateJWT,
    ensureLoggedIn,
    ensureCorrectUser,
    ensureAdmin
}