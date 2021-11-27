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
        check('startTime', 'startTime is required').not().isEmpty(),
        check('endTime', 'endDate is required').not().isEmpty(),
        check('price', 'price is required').not().isEmpty(),
        check('status', 'status is required').not().isEmpty(),
        check('booking', 'booking is required').not().isEmpty(),
        check('pitch', 'pitch is required').not().isEmpty(),
        check('booking').isMongoId().withMessage('booking is invalid id'),
        check('pitch').isMongoId().withMessage('pitch is invalid id'),
    ]
}

const validatePostbyPitchType = (req, res, next) => {
    return [
        check('startTime', 'startTime is required').not().isEmpty(),
        check('endTime', 'endDate is required').not().isEmpty(),
        check('price', 'price is required').not().isEmpty(),
        check('status', 'status is required').not().isEmpty(),
        check('booking', 'booking is required').not().isEmpty(),
        check('booking').isMongoId().withMessage('booking is invalid id'),
    ]

}

const validatePostbyPitchTypeFunction = async (req, res, next) => { 

    const {startTime, endTime, price, status, booking} = req.body
    const {isAdmin, userId} = req.payload

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

    // check startTime is before endTime
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

    const pitches = await Pitch.find({})
    .where('pitchType').equals(req.body.pitchType)

    //choose pitch in bookingDetail is not conflict with other bookingDetail
    const bookingDetail = await BookingDetail.find({})
    .select('startTime endTime status pitch')
    .populate({
        path: 'pitch',
        populate: {
            path: 'pitchType',
            select: 'displayName'
        }
    })
    

    // console.log(bookingDetail)
    let _next = true
    for (let i = 0; i < pitches.length; i++) {
        const pitch = pitches[i]._id.toString()
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

            if (startDateTime < startDateTimeAdd && endDateTime > startDateTimeAdd) {
                _next = false
                continue
            }
            if (startDateTime < endDateTimeAdd && endDateTime > endDateTimeAdd) {
                _next = false
                continue
            }
            if (startDateTime > startDateTimeAdd && endDateTime < endDateTimeAdd) {
                _next = false
                continue
            }
            if (startDateTime <= startDateTimeAdd && endDateTime >= endDateTimeAdd) {
                _next = false
                continue
            }

            //check time not exict price
            const _price = await Price.find({})
            .sort({time: 1})
            .where('pitchType').equals(req.body.pitchType.toString())
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
            if (!alStartTime.includes(startTimeArrayAdd[1]) || !alStartTime.includes(endTimeArrayAdd[1]) && !alEndTime.includes(startTimeArrayAdd[1]) || !alEndTime.includes(endTimeArrayAdd[1])) {
                _next = false
                continue
            }

        }
        if (_next === true) {
            req.body.pitch = pitch
            break
        }else
            _next = true
            continue
    }

    if(req.body.pitchType) 
    {
       
    }
    

    next()
}

const validFunction = async (req) => {

    const { startTime, endTime, price, status, booking, pitch } = req.body
    console.log(req.body)


}
    

const validatePostFunction = async (req, res, next) => {

    const {isAdmin, userId} = req.payload
    const {startTime, endTime, price, status, booking, pitch} = req.body

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
    console.log(alStartTime)
    console.log(alEndTime)
    console.log(startTimeArray2Add)
    console.log(endTimeArray2Add)
    if (!alStartTime.includes(startTimeArrayAdd[1]) || !alStartTime.includes(endTimeArrayAdd[1]) && !alEndTime.includes(startTimeArrayAdd[1]) || !alEndTime.includes(endTimeArrayAdd[1])) {
        return res.status(400).send({
            success: false,
            message: 'this time don\'t have price!',
        })
    }


    console.log(alStartTime)
    console.log(alEndTime)

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
        if (startDateTime <= startDateTimeAdd && endDateTime >= endDateTimeAdd) {
            return res.status(400).send({
                success: false,
                code: '0110',
                message: 'Booked already',
            })
        }

    }

    //check status is valid
    const statuses = await Status.find({})
    //make flat statusId
    const statusIds = statuses.map(status => status._id.toString())
    //check status in statusIds
    if (!statusIds.includes(status.toString())) {
        return res.status(400).send({
            success: false,
            message: 'status is invalid!',
        })
    }

    // check booking is valid
    const bookings = await Booking.findById({_id : booking})
        .populate({
            path: 'customer',
            match : { _id: userId },
        })
    if (!bookings.customer) {
        return res.status(400).send({
            success: false,
            message: 'booking is not yours!',
        })
    }

    next()
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

module.exports = { validatePost, validatePut, validateDelete, validateResult, validatePostFunction, validatePostbyPitchTypeFunction, validatePostbyPitchType, validFunction }
