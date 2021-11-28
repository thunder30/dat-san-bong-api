const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { check, validationResult } = require('express-validator')
const Price = require('../../models/Price')
const PitchType = require('../../models/PitchType')
const Time = require('../../models/Time')

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

const validatePostArrTime = async (req, res, next) => {

    if(!req.body.pitchType || !req.body.prices || req.body.prices.length === 0){
        return res.status(400).json({
            success: false,
            message: 'Bad request!',
        })
    }

    const { isAdmin, userId } = req.payload
    const {pitchType, prices} = req.body

    // Check if user is admin or owner of pitchType
    const valPriceOwner = await PitchType.find({})
    .where('_id').equals(pitchType)
    .populate(
        {
            path: 'pitchBranch',
            match: { owner: userId },
        }
    )
    let isOwner
    isOwner = valPriceOwner.some((value) => {
        return value.pitchBranch !== null
    })
    //check valid user
    if(!isOwner && !isAdmin){
        return res.status(400).json({
            success: false,
            message: 'You are not owner of this PitchType!',
        })
    }

    for(let i = 0; i < prices.length; i++){
        let { startTime, endTime, price } = prices[i]

        //check startTime in format HH:mm
        if(!startTime.match(/^([0-1]?[0-9]|2[0-3]):(00|30)$/) || !endTime.match(/^([0-1]?[0-9]|2[0-3]):(00|30)$/)){
            return res.status(400).json({
                success: false,
                message: 'Time must be in format HH:mm',
            })
        }

        // start time to HH:mm
        startTime = startTime.split(':')
        let _startTime = new Date(2020, 0, 1, startTime[0], startTime[1])
        endTime = endTime.split(':')
        let _endTime = new Date(2020, 0, 1, endTime[0], endTime[1])
    
        //check validate startTime endTime
        if(prices[i].startTime >= prices[i].endTime){
            return res.status(400).json({
                success: false,
                message: 'StartTime must be less than EndTime',
            })
        }

        //check validate price
        if(price % 1000 !== 0){
            return res.status(400).json({
                success: false,
                message: 'Price must be a multiple of 1000',
            })
        }

    }

    next()
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

module.exports = {validateDelete, validatePost, validatePut, validateGetByid, validatePostArrTime}