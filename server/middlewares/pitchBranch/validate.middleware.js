const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { check, validationResult } = require('express-validator')
const time = require('../time')


const validatePost = (req, res, next) => {

    //validate startTime endTime in format hh:mm
    const startTime = req.body.startTime
    const endTime = req.body.endTime
    const regex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
    if (!regex.test(startTime) || !regex.test(endTime))
    return res.status(400).json({
        success: false,
        message: 'Invalid time format!'
    })

    // Check validate phoneNumber
    const phoneNumber = req.body.phoneNumber
    const regexPhoneNumber = /^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/
    if (!regexPhoneNumber.test(phoneNumber))
    return res.status(400).json({
        success: false,
        message: 'Invalid phone format!'
    })

    // Check startTime < endtime
    const start = new Date(`1/1/2021 ${startTime}`)
    const end = new Date(`1/1/2021 ${endTime}`)
    if (start > end)
    return res.status(400).json({
        success: false,
        message: 'Start time must be smaller than end time'
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

    //validate startTime endTime in format hh:mm
    const startTime = req.body.startTime
    const endTime = req.body.endTime
    const regex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
    if (!regex.test(startTime) || !regex.test(endTime))
    return res.status(400).json({
        success: false,
        message: 'Invalid time format!'
    })

    // Check startTime < endtime
    const start = new Date(`1/1/2021 ${startTime}`)
    const end = new Date(`1/1/2021 ${endTime}`)
    if (start > end)
    return res.status(400).json({
        success: false,
        message: 'Start time must be smaller than end time'
    })


    // Check validate phoneNumber
    const phoneNumber = req.body.phoneNumber
    const regexPhoneNumber = /^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/
    if (!regexPhoneNumber.test(phoneNumber))
    return res.status(400).json({
        success: false,
        message: 'Invalid phone format!'
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
