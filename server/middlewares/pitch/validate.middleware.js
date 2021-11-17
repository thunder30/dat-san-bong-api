const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { check, validationResult } = require('express-validator')

const validatePost = (req, res, next) => {

    // Check pitchType , displayName not null
    const pitchType = req.body.pitchType
    const displayName = req.body.displayName
    if (!pitchType || !displayName)
    return res.status(400).json({
        success: false,
        message: 'pitchType and displayName is required !',
    })

    validateResult(req, res, next)
}

const validateDelete = (req, res, next) => {

    // check id
    const id = req.params.id
    if (!ObjectId.isValid(id))
    return res.status(400).json({
        success: false,
        message: '_id invalid',
    })

    validateResult(req, res, next)
}

const validatePut = (req, res, next) => {

    // check id
    const id = req.params.id
    if (!ObjectId.isValid(id))
    return res.status(400).json({
        success: false,
        message: '_id invalid',
    })

    validateResult(req, res, next)
}

const validateGetById = (req, res, next) => {

    // check id
    const id = req.params.id
    if (!ObjectId.isValid(id))
    return res.status(400).json({
        success: false,
        message: '_id invalid',
    })

    validateResult(req, res, next)
}

const validateGetByPitchType = (req, res, next) => {
    // check id
    // const id = req.params.id
    // if (!ObjectId.isValid(id))
    // return res.status(400).json({
    //     success: false,
    //     message: '_id invalid',
    // })

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

module.exports = { validatePost, validateDelete, validatePut, validateGetById, validateGetByPitchType }