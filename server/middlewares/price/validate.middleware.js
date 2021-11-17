const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { check, validationResult } = require('express-validator')

const validateDelete = (req, res, next) => {
    const id = req.params.id
    // check id
    if (!ObjectId.isValid(id))
        return res.status(400).json({
            success: false,
            message: '_id Invalid',
        })
    validateResult(req, res, next)
}

const validatePost = (req, res, next) => {
    let idPitchType = req.body.pitchType
    let idTime = req.body.time
    const { price } = req.body
    
    // check id
    if (!ObjectId.isValid(idPitchType) || !ObjectId.isValid(idTime))
    return res.status(400).json({
        success: false,
        message: '_id Invalid',
    })

    //Kiểm tra xem price có phải là bội của 10 không
    if(price % 1000 !== 0){
        return res.status(400).json({
            success: false,
            message: 'Price must be a multiple of 1000',
        })
    }

    if(price < 1000){
        return res.status(400).json({
            success: false,
            message: 'Price must be greater than 1000',
        })
    }

    validateResult(req, res, next)
}

const validatePut = (req, res, next) => {
    const id = req.params.id
    const { price } = req.body
    // check id
    if (!ObjectId.isValid(id))
        return res.status(400).json({
            success: false,
            message: '_id Invalid',
        })

        //Kiểm tra xem price có phải là bội của 10 không
    if(price % 1000 !== 0){
        return res.status(400).json({
            success: false,
            message: 'Price must be a multiple of 1000',
        })
    }

    validateResult(req, res, next)
}

const validateGetByid = (req, res, next) => {

    const id = req.params.id
    // check id
    if (!ObjectId.isValid(id))
        return res.status(400).json({
            success: false,
            message: '_id Invalid',
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

module.exports = {validateDelete, validatePost, validatePut, validateGetByid}