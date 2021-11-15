const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { check, validationResult } = require('express-validator')

const validatePost = (req, res, next) => {

    //check validate displayName , pitchBranch
    const { displayName, pitchBranch } = req.body
    if (!displayName || !pitchBranch) {
        return res.status(400).json({
            success: false,
            message: 'displayName, pitchBranch is required!',
        })
    }
    validateResult(req, res, next)
}

const validateGetById = (req, res, next) => {

    validateResult(req, res, next)
}

const validatePut = (req, res, next) => {

    validateResult(req, res, next)
}

const validateDelete = (req, res, next) => {

    validateResult(req, res, next)
}


const validateResult = (req, res, next) => {
    // Check validate body
    const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
        // Build your resulting errors however you want! String, object, whatever - it works!
        return `${location}[${param}]: ${msg}`
    }
    const result = validationResult(req).formatWith(errorFormatter)
    if (!result.isEmpty()) {
        // Response will contain something like
        // { errors: [ "body[password]: must be at least 10 chars long" ] }
        return res.status(400).json({
            success: false,
            message: 'Validate error!',
            errors: result.array(),
        })
    }
    next()
}

module.exports = { validatePost, validateDelete, validateGetById, validatePut }