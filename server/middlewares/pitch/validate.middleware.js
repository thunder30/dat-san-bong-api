const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { check, param, validationResult } = require('express-validator')

const validatePost = (req, res, next) => {

    // Check pitchType , displayName not null
    return [check('pitchType').not().isEmpty().withMessage('pitchType is required'),
        check('displayName').not().isEmpty().withMessage('displayName is required'),
        //check is id in mongoose
        check('pitchType').isMongoId().withMessage('pitchType is invalid id')
    ]
}

const validateDelete = (req, res, next) => {

    // check id
    const id = req.params.id
    if (!ObjectId.isValid(id))
    return res.status(400).json({
        success: false,
        messageEn: '_id invalid',
        message: '_id không hợp lệ',
    })

    validateResult(req, res, next)
}

const validatePut = (req, res, next) => {
    return [param('id').isMongoId().withMessage('_id is invalid id')]
}

const validateGetById = (req, res, next) => {

    return [
        param('id').isMongoId().withMessage('_id is invalid id')
    ]
    
}

const validateGetByPitchType = (req, res, next) => {

    const isAdmin = req.payload.isAdmin
    if (!Object.keys(req.query).length === 0){
        const pitchTypeId = req.query.pitchType
        if(!pitchTypeId){
            return res.status(400).json({
                success: false,
                messageEn: 'Bad request',
                message: 'Yêu cầu không hợp lệ',
            })
        }
    }

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
            messageEn: 'Validate error!',
            message: 'Lỗi xác thực!',
            errors: result.array(),
        })
    }
    next()
}

module.exports = { validatePost, validateDelete, validatePut, validateGetById, validateGetByPitchType, validateResult }
