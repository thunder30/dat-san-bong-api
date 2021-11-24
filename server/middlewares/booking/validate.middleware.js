const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { check, validationResult } = require('express-validator')

const validatePost = (req, res, next) => {

    return [
        check('startDate', 'startDate is required').not().isEmpty(),
        check('endDate', 'endDate is required').not().isEmpty(),
        check('customer', 'customer is required').not().isEmpty(),
    ]

}

const validatePostFunction = (req, res, next) => {
    //check startDate is dd/mm/yyyy
    const startDate = req.body.startDate
    const endDate = req.body.endDate
    const startDateFormat = /^\d{1,2}\/\d{1,2}\/\d{4}$/
    const endDateFormat = /^\d{1,2}\/\d{1,2}\/\d{4}$/
    if (!startDate.match(startDateFormat)) {
        return res.status(400).json({
            message: "startDate is not valid"
        })
    }
    if (!endDate.match(endDateFormat)) {
        return res.status(400).json({
            message: "endDate is not valid"
        })
    }

    if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
            message: "startDate is greater than endDate"
        })
    }

    if (new Date(startDate) < new Date()) {
        return res.status(400).json({
            message: "startDate must be greater than today"
        })
    }

    if(req.body.customer !== req.payload.userId){
        return res.status(400).json({
            success: false,
            message: "Id not yours"
        })
    }

    next()
    

}

const validateDelete = (req, res, next) => {

    validateResult(req, res, next)
}

const validatePut = (req, res, next) => {

    validateResult(req, res, next)
}

const validateGetByID = (req, res, next) => {

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

module.exports = { validatePost, validateDelete, validatePut, validateGetByID, validateResult, validatePostFunction }