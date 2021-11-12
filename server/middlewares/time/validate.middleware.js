const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { check, validationResult } = require('express-validator')

const validatePost = (req, res, next) => {
    const {code,startTime,endTime,description} = req.body

    //Check if not empty
    if(!code || !startTime || !endTime) {
        return res.status(400).json({
            success: false,
            message: 'Argument not found!'
        })
    }

    //validate startTime and endTime
    const startTime_validate = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/
    const endTime_validate = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/
    if(!startTime_validate.test(startTime) || !endTime_validate.test(endTime)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid time format!'
        })
    }
    validateResult(req, res, next)
}

const validatePut = (req, res, next) => {

    const {code,startTime,endTime,description} = req.body
    console.log(req.body)
        //Check if not empty
        if(!code || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Argument not found!'
            })
        }

    // check Put
    const id = req.params.id
    // check id
    if (!ObjectId.isValid(id))
        return res.status(400).json({
            success: false,
            message: '_id invalid',
        })
        
    //validate startTime and endTime
    const startTime_validate = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/
    const endTime_validate = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/
    if(!startTime_validate.test(startTime) || !endTime_validate.test(endTime)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid time format!'
        })
    }
    validateResult(req, res, next)
}

const validateDelete = (req, res, next) => {
    const id = req.params.id
    // check id
    if (!ObjectId.isValid(id))
        return res.status(400).json({
            success: false,
            message: 'Time not found!',
        })
    validateResult(req, res, next)
}

const validateGetOneTime = (req, res, next) => {
    const id = req.params.id
    // check id
    if (!ObjectId.isValid(id))
        return res.status(400).json({
            success: false,
            message: 'Time not found!',
        })

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


module.exports = { validatePost, validatePut, validateDelete, validateGetOneTime}