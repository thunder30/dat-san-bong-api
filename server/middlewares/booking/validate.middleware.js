const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { check, validationResult, body } = require('express-validator')
const Status = require('../../models/Status')
const Booking = require('../../models/Booking')
const BookingDetail = require('../../models/BookingDetail')
const Pitch = require('../../models/Pitch')
const Price = require('../../models/Price')
const User = require('../../models/User')

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
        populate: {
            path: 'pitchBranch',
            select: 'isActived'
        }
    })

    if (!_pitch.pitchType.pitchBranch.isActived) {
        return res.status(400).send({
            success: false,
            message: 'pitch is not actived!',
        })
    }
    
    if(!_pitch.pitchType.pitchBranch.isActived){
        return res.status(400).json({
            success: false,
            message: "Pitch branch is not actived"
        })
    }

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

const validatePutCheckinFunction = async (req, res, next) => {

    if(!req.params.id || !req.body.status) {
        return res.status(400).json({
            success: false,
            message: 'Bad request',
        })
    }

    const userId = req.payload.userId

    let bookingDetail = await BookingDetail.find({}).populate('status')
    for (let i = 0; i < bookingDetail.length; i++) {
        //get 6 last character of bookingDetailId
        let code = bookingDetail[i]._id.toString().substring(bookingDetail[i]._id.toString().length - 6)
        if(code === req.params.id) {
            // update status
            let ownerCheck = await BookingDetail.findOne(bookingDetail[i]._id).populate({
                path: 'pitch',
                populate: {
                    path: 'pitchType',
                    populate: {
                        path: 'pitchBranch',
                        select: 'owner',
                    }
                }
            })

            if(ownerCheck.pitch.pitchType.pitchBranch.owner.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not owner of this pitch!',
                })
            }
            
            var _bookingDetail = bookingDetail[i]

            req.body.bookingDetailId = bookingDetail[i]._id.toString()
            break
        }
    }
    
    console.log(_bookingDetail.status.status)

    if(_bookingDetail.status.status !== 'ST1') {
        return res.status(400).json({
            success: false,
            message: 'This code is inval status',
        })
    }

    // _bookingDetail.startTime = '26/11/2021 22:50'
    // _bookingDetail.endTime = '25/11/2021 23:50'
    const startTimeArray = _bookingDetail.startTime.split(' ')
    const endTimeArray = _bookingDetail.endTime.split(' ')
    const startDate = startTimeArray[0].split('/')
    const endDate = endTimeArray[0].split('/')
    const startTimeArray2 = startTimeArray[1].split(':')
    const endTimeArray2 = endTimeArray[1].split(':')
    const startDateTime = new Date(startDate[2], startDate[1] - 1, startDate[0], startTimeArray2[0], startTimeArray2[1])
    const endDateTime = new Date(endDate[2], endDate[1] - 1, endDate[0], endTimeArray2[0], endTimeArray2[1])


    const now = new Date()

    //if entire booking is checked in
    if(now > endDateTime) { 
        return res.status(400).json({
            success: false,
            message: 'This booking is expired',
        })
    }

    // if startTime - 30 <  now is true
    // startDateTime - 30 minute
    const startSub30 = new Date(startDateTime.getTime() - 30 * 60000)
    if(!(now > startSub30)) {
        return res.status(400).json({
            success: false,
            message: 'Start time is invalid!',
        })
    }

    next()
}

const validatePutCancelFunction = async (req, res, next) => {
    

    const bookingDetailId = req.params.id

    //check bookingDetailId is valid id
    if(!ObjectId.isValid(bookingDetailId)) {
        return res.status(400).json({
            success: false,
            message: 'Bad request',
        })
    }

    const userId = req.payload.userId
    if(!bookingDetailId || !req.body.status) {
        return res.status(400).json({
            success: false,
            message: 'Bad request',
        })
    }

    const bookingDetail = await BookingDetail.findById(bookingDetailId).populate('status booking')

    if(bookingDetail.booking.customer != userId) {
        return res.status(400).json({
            success: false,
            message: 'You are not owner of this booking!',
        })
    }

    if(bookingDetail.status.status !== 'ST1') {
        return res.status(400).json({
            success: false,
            message: 'You cannot cancel this booking',
        })
    }

    //startTime endTime to date object
    bookingDetail.startTime = "29/11/2021 19:40"
    const startTimeArray = bookingDetail.startTime.split(' ')
    const startDate = startTimeArray[0].split('/')
    const startTimeArray2 = startTimeArray[1].split(':')
    const startDateTime = new Date(startDate[2], startDate[1] - 1, startDate[0], startTimeArray2[0], startTimeArray2[1])

    // hủy trước 24h
    // startDatetime - 12 hours
    const now = new Date()
    const startSub = new Date(startDateTime.getTime() - 12 * 3600000)
    if(startSub < now) {
        return res.status(400).json({
            success: false,
            message: 'Entire time to cancel',
        })
    }

    next()
}

const validatePutRefreshFunction = async (req, res, next) => {

    const bookingDetail = await BookingDetail.find({})
    .populate({
        path: 'pitch',
        populate: {
            path: 'pitchType',
            match: { pitchBranch: req.params.id },
        }
    })

    for(let i = 0; i < bookingDetail.length; i++){
        if(bookingDetail[i].pitch.pitchType !== null){
            // startTime endTime to date
            // bookingDetail[i].startTime = "29/11/2021 19:40"
            // bookingDetail[i].endTime = "29/11/2021 19:40"
            const startTimeArray = bookingDetail[i].startTime.split(' ')
            const startDate = startTimeArray[0].split('/')
            const startTimeArray2 = startTimeArray[1].split(':')
            const startDateTime = new Date(startDate[2], startDate[1] - 1, startDate[0], startTimeArray2[0], startTimeArray2[1])
            const endTimeArray = bookingDetail[i].endTime.split(' ')
            const endDate = endTimeArray[0].split('/')
            const endTimeArray2 = endTimeArray[1].split(':')
            const endDateTime = new Date(endDate[2], endDate[1] - 1, endDate[0], endTimeArray2[0], endTimeArray2[1])
            
            const statusST1 = await Status.findOne({ status: 'ST1' })
            const statusST4 = await Status.findOne({ status: 'ST4' })

            // now 
            const now = new Date()
            if(now > endDateTime && bookingDetail[i].status.status === 'ST1') {
                bookingDetail[i].status = 'ST3'
                bookingDetail[i].save()
            }
            
        }
    }

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
        populate: {
            path: 'pitchBranch',
            select: 'isActived'
        }
    })
    if(!_pitch.pitchType.pitchBranch.isActived){
        return res.status(400).json({
            success: false,
            message: "Pitch branch is not actived"
        })
    }
    if(!_pitch.isActive){
        return res.status(400).json({
            success: false,
            message: "Pitch is not actived"
        })
    }

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
    // req.body.receiver = req.user._id.toString()
    const email = await User.findById(customer)
    req.body.receiver = email.email
    req.body.pitchName = _pitch.displayName
    const address = await Pitch.findById({_id:pitch}).populate({
        path: 'pitchType',
        populate: {
            path: 'pitchBranch',
            select: 'address ward district province'
        }
    })
    console.log(address)

    const add = address.pitchType.pitchBranch.address + ' ' + address.pitchType.pitchBranch.ward + ' ' + address.pitchType.pitchBranch.district + ' ' + address.pitchType.pitchBranch.province
    req.body.address = add

    next()

}

const validatePostStaticFunction = async (req, res, next) => {

    const isAdmin = req.payload.isAdmin
    // if(!isAdmin){
    const { startDate, endDate} = req.query
    if(!startDate || !endDate){
        return res.status(400).send({
            success: false,
            message: 'Missing information',
        })
    }
    //check startDate and endDate in format dd/MM/yyyy regex
    const regex = /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/
    if (!regex.test(startDate) || !regex.test(endDate)) {
        return res.status(400).send({
            success: false,
            message: 'StartDate and EndDate must be in format dd/MM/yyyy',
        })
    }

    //check startDate > endDate
    _startDate = convertStringToDate(startDate)
    _endDate = convertStringToDate(endDate)

    if (_startDate > _endDate) {
        return res.status(400).send({
            success: false,
            message: 'StartDate must be less than EndDate',
        })
    }

    if(!isAdmin){
        let pitchBranchId = req.query.pitchBranchId
        if(!pitchBranchId){
            return res.status(400).send({
                success: false,
                message: 'Missing information',
            })
        }
        //check pitchBranchId is MongoId
        if (!mongoose.Types.ObjectId.isValid(pitchBranchId)) {
            return res.status(400).send({
                success: false,
                message: 'pitchBranchId is not valid',
            })
        }
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

function convertStringToDate(s) {
    const splDay = s.split('/')
    const dateTime = new Date(splDay[2], splDay[1] - 1, splDay[0])
    return dateTime
}

module.exports = { validatePost, validateDelete, validatePut
    , validateGetByID, validateResult, validatePostFunction
    , validateCheckout, validateCheckoutFunction
    , validatePostConfirm, validatePostConfirmFunction, validatePutCheckinFunction
    , validatePutCancelFunction, validatePutRefreshFunction, validatePostStaticFunction }