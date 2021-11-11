const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

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
    next()
}

const validatePut = (req, res, next) => {
    // check Put
    const id = req.params.id
    // check id
    if (!ObjectId.isValid(id))
        return res.status(400).json({
            success: false,
            message: 'Time not found!',
        })
        
    const {code,startTime,endTime,description} = req.body
    console.log(req.body)
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
    next()
}

const validateDelete = (req, res, next) => {
    const id = req.params.id
    // check id
    if (!ObjectId.isValid(id))
        return res.status(400).json({
            success: false,
            message: 'Time not found!',
        })
    next()
}

const validateGetOneTime = (req, res, next) => {
    const id = req.params.id
    // check id
    if (!ObjectId.isValid(id))
        return res.status(400).json({
            success: false,
            message: 'Time not found!',
        })
    next()
}

module.exports = { validatePost, validatePut, validateDelete, validateGetOneTime}