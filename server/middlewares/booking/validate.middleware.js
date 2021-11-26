const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { check, validationResult } = require('express-validator')
const Status = require('../../models/Status')
const Booking = require('../../models/Booking')
const BookingDetail = require('../../models/BookingDetail')
const Pitch = require('../../models/Pitch')
const Price = require('../../models/Price')

const validatePost = (req, res, next) => {

    return [
        check('startDate', 'startDate is required').not().isEmpty(),
        check('endDate', 'endDate is required').not().isEmpty(),
        check('customer', 'customer is required').not().isEmpty(),
    ]

}

const validateCheckout = (req, res, next) => {
    return[
        check('startTime', 'startDate is required').not().isEmpty(),
        check('endTime', 'endDate is required').not().isEmpty(),
        // check('customer', 'customer is required').not().isEmpty(),
        check('pitch', 'pitch is required').not().isEmpty(),
        check('pitch').isMongoId().withMessage('pitch is invalid id'),
        // check('customer').isMongoId().withMessage('customer is invalid id'),
    ]
}

const validatePostConfirm = (req, res, next) => {
    return [
        check('startTime', 'startDate is required').not().isEmpty(),
        check('endTime', 'endDate is required').not().isEmpty(),
        check('customer', 'customer is required').not().isEmpty(),
        check('pitch', 'pitch is required').not().isEmpty(),
        check('pitch').isMongoId().withMessage('pitch is invalid id'),
        check('customer').isMongoId().withMessage('customer is invalid id'),
        check('isPaid', 'isPaid is required').not().isEmpty(),
        check('status', 'status is required').not().isEmpty(),
    ]
}

const validateCheckoutFunction = async (req, res, next) => {

    const {isAdmin, userId} = req.payload
    const {startTime, endTime, pitch} = req.body
    // const {startTime, endTime, pitch, customer} = req.body

    // if(customer !== userId){
    //     return res.status(400).json({
    //         success: false,
    //         message: "Id not yours"
    //     })
    // }

    //check startTime is in format dd/mm/yyyy HH:mm
    const startTimeRegex = /^(0[1-9]|[12][0-9]|3[01])[\/](0[1-9]|1[012])[\/]\d{4} (0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$/
    const endTimeRegex = /^(0[1-9]|[12][0-9]|3[01])[\/](0[1-9]|1[012])[\/]\d{4} (0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$/
    if (!startTimeRegex.test(startTime)) {
        return res.status(400).send({
            success: false,
            message: 'startTime is invalid!',
        })
    }
    if (!endTimeRegex.test(endTime)) {
        return res.status(400).send({
            success: false,
            message: 'endTime is invalid!',
        })
    }

    //check startTime is before endTime
    const startTimeArrayAdd = startTime.split(' ')
    const endTimeArrayAdd = endTime.split(' ')
    const startDate = startTimeArrayAdd[0].split('/')
    const endDate = endTimeArrayAdd[0].split('/')
    const startTimeArray2Add = startTimeArrayAdd[1].split(':')
    const endTimeArray2Add = endTimeArrayAdd[1].split(':')
    const startDateTimeAdd = new Date(startDate[2], startDate[1] - 1, startDate[0], startTimeArray2Add[0], startTimeArray2Add[1])
    const endDateTimeAdd = new Date(endDate[2], endDate[1] - 1, endDate[0], endTimeArray2Add[0], endTimeArray2Add[1])
    if (startDateTimeAdd > endDateTimeAdd) {
        return res.status(400).send({
            success: false,
            message: 'startTime is after endTime!',
        })
    }

    //check startTime is not in the past
    const currentDate = new Date()
    if (startDateTimeAdd < currentDate) {
        return res.status(400).send({
            success: false,
            message: 'startTime must be in future!',
        })
    }

    const _pitch = await Pitch.findOne({})
    .where('_id').equals(req.body.pitch)
    .populate({
        path: 'pitchType',
    })

    const _price = await Price.find({})
    .sort({time: 1})
    .where('pitchType').equals(_pitch.pitchType)
    .populate({
        path: 'time'
    })

    //make flat startTime in _price
    const alStartTime = _price.map(item => {
        return item.time.startTime
    })
    //make flat endTime in _price
    const alEndTime = _price.map(item => {
        return item.time.endTime
    })

    //check startTime is in _price
    // console.log(alStartTime)
    // console.log(alEndTime)
    // console.log(startTimeArray2Add)
    // console.log(endTimeArray2Add)
    if (!alStartTime.includes(startTimeArrayAdd[1]) || !alStartTime.includes(endTimeArrayAdd[1]) && !alEndTime.includes(startTimeArrayAdd[1]) || !alEndTime.includes(endTimeArrayAdd[1])) {
        return res.status(400).send({
            success: false,
            message: 'this time don\'t have price!',
        })
    }

    // console.log(alStartTime)
    // console.log(alEndTime)

    // check time not conflict with other bookingDetail
    const bookingDetails = await BookingDetail.find({})
    .where('pitch').equals(pitch)
    .select('startTime endTime')
    for (let i = 0; i < bookingDetails.length; i++) {
        const startTimeArray = bookingDetails[i].startTime.split(' ')
        const endTimeArray = bookingDetails[i].endTime.split(' ')
        const startDate = startTimeArray[0].split('/')
        const endDate = endTimeArray[0].split('/')
        const startTimeArray2 = startTimeArray[1].split(':')
        const endTimeArray2 = endTimeArray[1].split(':')
        const startDateTime = new Date(startDate[2], startDate[1] - 1, startDate[0], startTimeArray2[0], startTimeArray2[1])
        const endDateTime = new Date(endDate[2], endDate[1] - 1, endDate[0], endTimeArray2[0], endTimeArray2[1])

        if (startDateTime.toString() === startDateTimeAdd.toString() || startDateTime.toString() == endDateTimeAdd.toString()) {
            return res.status(400).send({
                success: false,
                code: '0000',
                message: 'Booked already',
            })
        }

        if (startDateTime < startDateTimeAdd && endDateTime > startDateTimeAdd) {

            return res.status(400).send({
                success: false,
                code: '0101',
                message: 'Booked already',
            })
        }
        if (startDateTime < endDateTimeAdd && endDateTime > endDateTimeAdd) {
            return res.status(400).send({
                success: false,
                code: '1010',
                message: 'Booked already',
            })
        }
        if (startDateTime > startDateTimeAdd && endDateTime < endDateTimeAdd) {
            return res.status(400).send({
                success: false,
                code: '1001',
                message: 'Booked already',
            })
        }
        if (startDateTime < startDateTimeAdd && endDateTime > endDateTimeAdd) {
            return res.status(400).send({
                success: false,
                code: '0110',
                message: 'Booked already',
            })
        }

    }

    // create array Time of bookingDetail request
    const startTimeArrayAdd2 = startTimeArrayAdd[1].split(':')
    const startTimeArrayAdd3 = endTimeArrayAdd[1].split(':')
    let le = 30
    if(startTimeArrayAdd2[1] == '00')
    le = 00
    let arrTime = []
    for (let i = startTimeArrayAdd2[0].toString(); i <= startTimeArrayAdd3[0]; i++) {
        if(le == 00){
            if(i<10){
                if(i == startTimeArrayAdd2[0])
                arrTime.push(i + ':' + '00')
                arrTime.push('0' + i + ':' + '00')
            }
            else
            arrTime.push(i + ':' + '00')
            le = 30
        }else{
            if(i<10){
                if(i == startTimeArrayAdd2[0])
                arrTime.push(i + ':' + '30')
                else
                arrTime.push('0' + i + ':'+ '30')
            }
            else
            arrTime.push(i + ':' + '30')
            le = 00
        }
        if(i == startTimeArrayAdd3[0] && startTimeArrayAdd3[1] == '30'){
            if(i<10)
            arrTime.push('0' + i + ':'+ '30')
            else
            arrTime.push(i + ':' + '30')
        }
            
    }

    //compare time for money
    let sumPrice = 0
    for(let i = 0; i < _price.length; i++){
        for(let j = 0; j < arrTime.length; j+=1){
            if(arrTime[j] == _price[i].time.startTime && arrTime[j+1] == _price[i].time.endTime){
                sumPrice += _price[i].price
            }
        }
    }

    req.body.price = sumPrice
    
    next()
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

const validatePostConfirmFunction = async (req, res, next) => {

    const {isAdmin, userId} = req.payload
    const {startTime, endTime, pitch, customer} = req.body

    if(customer !== userId){
        return res.status(400).json({
            success: false,
            message: "Id not yours"
        })
    }

    //check startTime is in format dd/mm/yyyy HH:mm
    const startTimeRegex = /^(0[1-9]|[12][0-9]|3[01])[\/](0[1-9]|1[012])[\/]\d{4} (0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$/
    const endTimeRegex = /^(0[1-9]|[12][0-9]|3[01])[\/](0[1-9]|1[012])[\/]\d{4} (0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$/
    if (!startTimeRegex.test(startTime)) {
        return res.status(400).send({
            success: false,
            message: 'startTime is invalid!',
        })
    }
    if (!endTimeRegex.test(endTime)) {
        return res.status(400).send({
            success: false,
            message: 'endTime is invalid!',
        })
    }

    //check startTime is before endTime
    const startTimeArrayAdd = startTime.split(' ')
    const endTimeArrayAdd = endTime.split(' ')
    const startDate = startTimeArrayAdd[0].split('/')
    const endDate = endTimeArrayAdd[0].split('/')
    const startTimeArray2Add = startTimeArrayAdd[1].split(':')
    const endTimeArray2Add = endTimeArrayAdd[1].split(':')
    const startDateTimeAdd = new Date(startDate[2], startDate[1] - 1, startDate[0], startTimeArray2Add[0], startTimeArray2Add[1])
    const endDateTimeAdd = new Date(endDate[2], endDate[1] - 1, endDate[0], endTimeArray2Add[0], endTimeArray2Add[1])
    if (startDateTimeAdd > endDateTimeAdd) {
        return res.status(400).send({
            success: false,
            message: 'startTime is after endTime!',
        })
    }

    //check startTime is not in the past
    const currentDate = new Date()
    if (startDateTimeAdd < currentDate) {
        return res.status(400).send({
            success: false,
            message: 'startTime must be in future!',
        })
    }

    const _pitch = await Pitch.findOne({})
    .where('_id').equals(req.body.pitch)
    .populate({
        path: 'pitchType',
    })

    const _price = await Price.find({})
    .sort({time: 1})
    .where('pitchType').equals(_pitch.pitchType)
    .populate({
        path: 'time'
    })

    //make flat startTime in _price
    const alStartTime = _price.map(item => {
        return item.time.startTime
    })
    //make flat endTime in _price
    const alEndTime = _price.map(item => {
        return item.time.endTime
    })

    //check startTime is in _price
    // console.log(alStartTime)
    // console.log(alEndTime)
    // console.log(startTimeArray2Add)
    // console.log(endTimeArray2Add)
    if (!alStartTime.includes(startTimeArrayAdd[1]) || !alStartTime.includes(endTimeArrayAdd[1]) && !alEndTime.includes(startTimeArrayAdd[1]) || !alEndTime.includes(endTimeArrayAdd[1])) {
        return res.status(400).send({
            success: false,
            message: 'this time don\'t have price!',
        })
    }

    // console.log(alStartTime)
    // console.log(alEndTime)

    // check time not conflict with other bookingDetail
    const bookingDetails = await BookingDetail.find({})
    .where('pitch').equals(pitch)
    .select('startTime endTime')
    for (let i = 0; i < bookingDetails.length; i++) {
        const startTimeArray = bookingDetails[i].startTime.split(' ')
        const endTimeArray = bookingDetails[i].endTime.split(' ')
        const startDate = startTimeArray[0].split('/')
        const endDate = endTimeArray[0].split('/')
        const startTimeArray2 = startTimeArray[1].split(':')
        const endTimeArray2 = endTimeArray[1].split(':')
        const startDateTime = new Date(startDate[2], startDate[1] - 1, startDate[0], startTimeArray2[0], startTimeArray2[1])
        const endDateTime = new Date(endDate[2], endDate[1] - 1, endDate[0], endTimeArray2[0], endTimeArray2[1])

        if (startDateTime.toString() === startDateTimeAdd.toString() || startDateTime.toString() == endDateTimeAdd.toString()) {
            return res.status(400).send({
                success: false,
                code: '0000',
                message: 'Booked already',
            })
        }

        if (startDateTime < startDateTimeAdd && endDateTime > startDateTimeAdd) {

            return res.status(400).send({
                success: false,
                code: '0101',
                message: 'Booked already',
            })
        }
        if (startDateTime < endDateTimeAdd && endDateTime > endDateTimeAdd) {
            return res.status(400).send({
                success: false,
                code: '1010',
                message: 'Booked already',
            })
        }
        if (startDateTime > startDateTimeAdd && endDateTime < endDateTimeAdd) {
            return res.status(400).send({
                success: false,
                code: '1001',
                message: 'Booked already',
            })
        }
        if (startDateTime < startDateTimeAdd && endDateTime > endDateTimeAdd) {
            return res.status(400).send({
                success: false,
                code: '0110',
                message: 'Booked already',
            })
        }

    }

    // create array Time of bookingDetail request
    const startTimeArrayAdd2 = startTimeArrayAdd[1].split(':')
    const startTimeArrayAdd3 = endTimeArrayAdd[1].split(':')
    let le = 30
    if(startTimeArrayAdd2[1] == '00')
    le = 00
    let arrTime = []
    for (let i = startTimeArrayAdd2[0].toString(); i <= startTimeArrayAdd3[0]; i++) {
        if(le == 00){
            if(i<10){
                if(i == startTimeArrayAdd2[0])
                arrTime.push(i + ':' + '00')
                arrTime.push('0' + i + ':' + '00')
            }
            else
            arrTime.push(i + ':' + '00')
            le = 30
        }else{
            if(i<10){
                if(i == startTimeArrayAdd2[0])
                arrTime.push(i + ':' + '30')
                else
                arrTime.push('0' + i + ':'+ '30')
            }
            else
            arrTime.push(i + ':' + '30')
            le = 00
        }
        if(i == startTimeArrayAdd3[0] && startTimeArrayAdd3[1] == '30'){
            if(i<10)
            arrTime.push('0' + i + ':'+ '30')
            else
            arrTime.push(i + ':' + '30')
        }
            
    }

    //compare time for money
    let sumPrice = 0
    for(let i = 0; i < _price.length; i++){
        for(let j = 0; j < arrTime.length; j+=1){
            if(arrTime[j] == _price[i].time.startTime && arrTime[j+1] == _price[i].time.endTime){
                sumPrice += _price[i].price
            }
        }
    }

    req.body.price = sumPrice

    req.body.startDate = startTimeArrayAdd[0]
    req.body.endDate = endTimeArrayAdd[0]

    const status = await Status.findOne({status: 'ST1'})
    req.body.status = status._id.toString()
    
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

module.exports = { validatePost, validateDelete, validatePut
    , validateGetByID, validateResult, validatePostFunction
    , validateCheckout, validateCheckoutFunction
    , validatePostConfirm, validatePostConfirmFunction }