//Jobs routes
const express = require("express");
const ExpressError = require("../expressError");
const Job = require("../models/job");
const jsonschema = require("jsonschema");
const newJobSchema = require("../schemas/job_schemas/newJobSchema.json")
const editJobSchema = require("../schemas/job_schemas/editJobSchema.json")
const {ensureLoggedIn, ensureAdmin} = require("../middleware/auth");

const router = new express.Router();

/*
    GET /jobs : Return the handle and name for all of the job objects. It should also allow for the following query string parameters

    search - Displays a filtered list of titles and company handles based on the search term and if the title includes it.
    min_salary: Displays titles and company handles that have a salary greater than the value of the query string parameter.
    min_equity: Displays titles and company handles that have an equity greater than the value of the query string parameter.
*/
router.get("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const jobs = await Job.getAll(req.query.search, req.query.min_salary, req.query.min_equity);
        return res.json({jobs: jobs});
    } catch (err) {
        return next(err);
    }
});

/*
    POST /jobs : Create a new job and return the data for it after validating against jsonschema
*/
router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, newJobSchema);
        if (!result.valid) {
            let listOfErrors = result.errors.map(error => error.stack);
            let error = new ExpressError(listOfErrors, 400);
            return next(error);
        }
    
        const job = await Job.create(req.body);
        return res.status(201).json({job: job});
    } catch (err) {
        return next(err);
    }
});

/*
    GET /jobs/[id] : Search for a job by it's id and return the result (if it exists)
*/
router.get("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
        const job = await Job.getOne(req.params.id);
        return res.json({job: job});
    } catch (err) {
        return next(err);
    }
});

/*
    PATCH /jobs/[id] : Search for a job by it's id and update it's data based on incoming data and return the result (if it exists)
*/
router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, editJobSchema);
        if (!result.valid) {
            let listOfErrors = result.errors.map(error => error.stack);
            let error = new ExpressError(listOfErrors, 400);
            return next(error);
        }
        const job = await Job.update(req.params.id, req.body);
        return res.json({job: job});
    } catch (err) {
        return next(err);
    }
});

/*
    DELETE /jobs/[id] : Search for a job by it's id and delete it (if it exists)
*/
router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const job = await Job.delete(req.params.id);
        return res.json({message: job});
    } catch (err) {
        return next(err);
    }
});

module.exports = router;