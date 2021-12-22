const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { check, validationResult, body } = require('express-validator')
const Status = require('../../models/Status')
const Booking = require('../../models/Booking')
const BookingDetail = require('../../models/BookingDetail')
const Pitch = require('../../models/Pitch')
const Price = require('../../models/Price')
const User = require('../../models/User')
const PitchType = require('../../models/PitchType')
const PitchBranch= require('../../models/PitchBranch')

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
            messageEn: 'startTime is invalid!',
            message: 'Thời gian bắt đầu không hợp lệ!',
        })
    }
    if (!endTimeRegex.test(endTime)) {
        return res.status(400).send({
            success: false,
            messageEn: 'endTime is invalid!',
            message: 'Thời gian kết thúc không hợp lệ!',
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
    if (startDateTimeAdd >= endDateTimeAdd) {
        return res.status(400).send({
            success: false,
            messageEn: 'startTime is after endTime!',
            message: 'Thời gian bắt đầu phải trước thời gian kết thúc!',
        })
    }

    //check startTime is not in the past
    const currentDate = new Date()
    if (startDateTimeAdd < currentDate) {
        return res.status(400).send({
            success: false,
            messageEn: 'startTime must be in future!',
            message: 'Thời gian bắt đầu phải là thời gian tương lai!',
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
            messageEn: 'pitch is not actived!',
            message: 'Sân không được kích hoạt!',
        })
    }

    if(!_pitch.pitchType.pitchBranch.isActived){
        return res.status(400).json({
            success: false,
            messageEn: "Pitch branch is not actived",
            message: "Sân chưa được kích hoạt!"
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
    if (!alStartTime.includes(startTimeArrayAdd[1]) || !alStartTime.includes(endTimeArrayAdd[1]) && !alEndTime.includes(startTimeArrayAdd[1]) || !alEndTime.includes(endTimeArrayAdd[1])) {
        if(!(alStartTime.includes(startTimeArrayAdd[1]) && alEndTime.includes(endTimeArrayAdd[1])))
        return res.status(400).send({
            success: false,
            messageEn: 'this time don\'t have price!',
            message: 'Thời gian này chưa có giá!',
        })
    }

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
                messageEn: 'Booked already',
                message: 'Đã đặt trước đó!',
            })
        }

        if (startDateTime < startDateTimeAdd && endDateTime > startDateTimeAdd) {

            return res.status(400).send({
                success: false,
                code: '0101',
                messageEn: 'Booked already',
                message: 'Đã đặt trước đó!',
            })
        }
        if (startDateTime < endDateTimeAdd && endDateTime > endDateTimeAdd) {
            return res.status(400).send({
                success: false,
                code: '1010',
                messageEn: 'Booked already',
                message: 'Đã đặt trước đó!',
            })
        }
        if (startDateTime > startDateTimeAdd && endDateTime < endDateTimeAdd) {
            return res.status(400).send({
                success: false,
                code: '1001',
                messageEn: 'Booked already',
                message: 'Đã đặt trước đó!',
            })
        }
        if (startDateTime < startDateTimeAdd && endDateTime > endDateTimeAdd) {
            return res.status(400).send({
                success: false,
                code: '0110',
                messageEn: 'Booked already',
                message: 'Đã đặt trước đó!',
            })
        }

    }

    const _Pitch = await Pitch.findById(pitch)
    const _PitchType = await PitchType.findById(_Pitch.pitchType)
    const _pitchBranch = await PitchBranch.findById(_PitchType.pitchBranch)
    //convert _pitchBranch.startTime HH:MM to Date
    const startTimeBranch = _pitchBranch.startTime.split(':')
    const startDateBranch = new Date(0,0,0,startTimeBranch[0], startTimeBranch[1])
    //convert _pitchBranch.endTime HH:MM to Date
    const endTimeBranch = _pitchBranch.endTime.split(':')
    const endDateBranch = new Date(0,0,0,endTimeBranch[0], endTimeBranch[1])
    let _arrTimeBranch = createArrayTime(startDateBranch,endDateBranch)
    //check startTimeAdd is in _arrTimeBranch
    if (!_arrTimeBranch.includes(startTimeArrayAdd[1]) || !_arrTimeBranch.includes(endTimeArrayAdd[1])) {
        return res.status(400).send({
            success: false,
            messageEn: 'this time not available!',
            message: 'Thời gian này không mở cửa',
        })
    }

    let arrTime = createArrayTime(startDateTimeAdd, endDateTimeAdd)
    //compare time for money
    let sumPrice = 0
    for(let i = 0; i < _price.length; i++){
        for(let j = 0; j < arrTime.length; j+=1){
            if(arrTime[j] == _price[i].time.startTime && arrTime[j+1] == _price[i].time.endTime){
                // console.log(arrTime[j] + ' ' + arrTime[j+1])
                // console.log(_price[i].price)
                sumPrice += _price[i].price
            }
        }
    }

    req.body.price = sumPrice
    
    next()
}

const validatePutCheckinFunction = async (req, res, next) => {

    if(!req.params.id) {
        return res.status(400).json({
            success: false,
            messageEn: 'Bad request',
            message: 'Yêu cầu không hợp lệ',
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
                    messageEn: 'You are not owner of this pitch!',
                    message: 'Bạn không phải chủ sở hữu của sân này!',
                })
            }
            
            var _bookingDetail = bookingDetail[i]

            req.body.bookingDetailId = bookingDetail[i]._id.toString()
            break
        }
    }
    if(!_bookingDetail) {
        return res.status(400).json({
            success: false,
            messageEn: 'Bad request or Code is not exist!',
            message: 'Mã không tồn tại!',
        })
    }
    
    // console.log(_bookingDetail)

    if(_bookingDetail.status.status !== 'ST1') {
        return res.status(400).json({
            success: false,
            messageEn: 'This code have inval status',
            message: 'Mã đã được sử dụng!',
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
            messageEn: 'This booking is expired',
            message: 'Đã hết hạn phiếu đặt sân!',
        })
    }

    // if startTime - 30 <  now is true
    // startDateTime - 30 minute
    const startSub30 = new Date(startDateTime.getTime() - 30 * 60000)
    if(!(now > startSub30)) {
        return res.status(400).json({
            success: false,
            messageEn: 'Start time is invalid!',
            message: 'Thời gian bắt đầu đặt sân không hợp lệ!',
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
            messageEn: 'Bad request',
            message: 'Yêu cầu không hợp lệ',
        })
    }

    const userId = req.payload.userId
    if(!bookingDetailId) {
        return res.status(400).json({
            success: false,
            messageEn: 'Bad request',
            message: 'Yêu cầu không hợp lệ',
        })
    }

    const bookingDetail = await BookingDetail.findById(bookingDetailId).populate('status booking')

    if(bookingDetail.booking.customer != userId) {
        return res.status(400).json({
            success: false,
            messageEn: 'You are not owner of this booking!',
            message: 'Bạn không phải chủ sở hữu phiếu đặt sân này!',
        })
    }

    if(bookingDetail.status.status !== 'ST1') {
        return res.status(400).json({
            success: false,
            messageEn: 'You cannot cancel this booking',
            message: 'Bạn không thể hủy đặt sân này!',
        })
    }

    //startTime endTime to date object
    // bookingDetail.startTime = "29/11/2021 19:40"
    const startTimeArray = bookingDetail.startTime.split(' ')
    const startDate = startTimeArray[0].split('/')
    const startTimeArray2 = startTimeArray[1].split(':')
    const startDateTime = new Date(startDate[2], startDate[1] - 1, startDate[0], startTimeArray2[0], startTimeArray2[1])

    // hủy trước 24h
    // startDatetime - 12 hours
    const now = new Date()
    const startSub = new Date(startDateTime.getTime() - 12 * 3600000)
    // console.log(startSub.getTime())
    // console.log(now.getTime())
    // console.log(startSub.getDate() + ' ' + now.getDate())
    // console.log(now)
    if(startSub.getTime() < now.getTime()) {
        return res.status(400).json({
            success: false,
            messageEn: 'Entire time to cancel',
            message: 'Đã hết hạn hủy sân!',
        })
    }

    next()
}

const validatePutCancelOwnerFunction = async (req, res, next) => {
    
    const bookingDetailId = req.params.id

    //check bookingDetailId is valid id
    if(!ObjectId.isValid(bookingDetailId)) {
        return res.status(400).json({
            success: false,
            messageEn: 'Bad request',
            message: 'Yêu cầu không hợp lệ',
        })
    }

    const userId = req.payload.userId
    if(!bookingDetailId ) {
        return res.status(400).json({
            success: false,
            messageEn: 'Bad request',
            message: 'Yêu cầu không hợp lệ',
        })
    }

    const bookingDetail = await BookingDetail.findById(bookingDetailId).populate('status booking')
    const pitch = await Pitch.findById(bookingDetail.pitch)
    const pitchType = await PitchType.findById(pitch.pitchType)
    const pitchBranch = await PitchBranch.findById(pitchType.pitchBranch)
    
    if(pitchBranch.owner != userId) {
        return res.status(400).json({
            success: false,
            messageEn: 'You are not owner of this booking!',
            message: 'Bạn không phải chủ sân của phiếu đặt sân này!',
        })
    }

    if(bookingDetail.status.status !== 'ST1') {
        return res.status(400).json({
            success: false,
            messageEn: 'You cannot cancel this booking',
            message: 'Bạn không thể hủy đặt sân này!',
        })
    }

    //startTime endTime to date object
    // bookingDetail.startTime = "29/11/2021 19:40"
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
            messageEn: 'Entire time to cancel',
            message: 'Đã hết hạn hủy sân!',
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
            success: false,
            messageEn: "startDate is not valid",
            message: "Ngày bắt đầu không hợp lệ",
        })
    }
    if (!endDate.match(endDateFormat)) {
        return res.status(400).json({
            success: false,
            messageEn: "endDate is not valid",
            message: "Ngày kết thúc không hợp lệ",
        })
    }

    if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
            success: false,
            messageEn: "startDate is greater than endDate",
            message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc",
        })
    }

    if (new Date(startDate) < new Date()) {
        return res.status(400).json({
            success: false,
            messageEn: "startDate must be greater than today",
            message: "Ngày bắt đầu phải lớn hơn ngày hiện tại",
        })
    }

    if(req.body.customer !== req.payload.userId){
        return res.status(400).json({
            success: false,
            messageEn: "Id not yours",
            message: "Id không phải của bạn",
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
            messageEn: "Id not yours",
            message: "Id không phải của bạn",
        })
    }

    //check true phone
    if(req.body.phone){
        //check phone is valid VN number
        const phone = req.body.phone
        const phoneFormat = /^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/
        if (!phone.match(phoneFormat)) {
            return res.status(400).json({
                success: false,
                messageEn: "phone is not valid",
                message: "Số điện thoại không hợp lệ",
            })
        }
    }


    //check startTime is in format dd/mm/yyyy HH:mm
    const startTimeRegex = /^(0[1-9]|[12][0-9]|3[01])[\/](0[1-9]|1[012])[\/]\d{4} (0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$/
    const endTimeRegex = /^(0[1-9]|[12][0-9]|3[01])[\/](0[1-9]|1[012])[\/]\d{4} (0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$/
    if (!startTimeRegex.test(startTime)) {
        return res.status(400).send({
            success: false,
            messageEn: 'startTime is invalid!',
            message: 'Thời gian bắt đầu không hợp lệ',
        })
    }
    if (!endTimeRegex.test(endTime)) {
        return res.status(400).send({
            success: false,
            messageEn: 'endTime is invalid!',
            message: 'Thời gian kết thúc không hợp lệ',
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
    if (startDateTimeAdd >= endDateTimeAdd) {
        return res.status(400).send({
            success: false,
            messageEn: 'startTime is after endTime!',
            message: 'Thời gian bắt đầu phải trước thời gian kết thúc',
        })
    }

    //check startTime is not in the past
    const currentDate = new Date()
    if (startDateTimeAdd < currentDate) {
        return res.status(400).send({
            success: false,
            messageEn: 'startTime must be in future!',
            message: 'Thời gian bắt đầu phải lớn hơn thời gian hiện tại',
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
            messageEn: "Pitch branch is not actived",
            message: "Chi nhánh của sân chưa được kích hoạt",
        })
    }
    if(!_pitch.isActive){
        return res.status(400).json({
            success: false,
            messageEn: "Pitch is not actived",
            message: "Sân chưa được kích hoạt",
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
        if(!(alStartTime.includes(startTimeArrayAdd[1]) && alEndTime.includes(endTimeArrayAdd[1])))
        return res.status(400).send({
            success: false,
            messageEn: 'this time don\'t have price!',
            message: 'Thời gian này không có giá',
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
                messageEn: 'Booked already',
                message: 'Đã đặt trước',
            })
        }

        if (startDateTime < startDateTimeAdd && endDateTime > startDateTimeAdd) {

            return res.status(400).send({
                success: false,
                code: '0101',
                messageEn: 'Booked already',
                message: 'Đã đặt trước',
            })
        }
        if (startDateTime < endDateTimeAdd && endDateTime > endDateTimeAdd) {
            return res.status(400).send({
                success: false,
                code: '1010',
                messageEn: 'Booked already',
                message: 'Đã đặt trước',
            })
        }
        if (startDateTime > startDateTimeAdd && endDateTime < endDateTimeAdd) {
            return res.status(400).send({
                success: false,
                code: '1001',
                messageEn: 'Booked already',
                message: 'Đã đặt trước',
            })
        }
        if (startDateTime < startDateTimeAdd && endDateTime > endDateTimeAdd) {
            return res.status(400).send({
                success: false,
                code: '0110',
                messageEn: 'Booked already',
                message: 'Đã đặt trước',
            })
        }

    }

    const _Pitch = await Pitch.findById(pitch)
    const _PitchType = await PitchType.findById(_Pitch.pitchType)
    const _pitchBranch = await PitchBranch.findById(_PitchType.pitchBranch)
    //convert _pitchBranch.startTime HH:MM to Date
    const startTimeBranch = _pitchBranch.startTime.split(':')
    const startDateBranch = new Date(0,0,0,startTimeBranch[0], startTimeBranch[1])
    //convert _pitchBranch.endTime HH:MM to Date
    const endTimeBranch = _pitchBranch.endTime.split(':')
    const endDateBranch = new Date(0,0,0,endTimeBranch[0], endTimeBranch[1])
    let _arrTimeBranch = createArrayTime(startDateBranch,endDateBranch)
    //check startTimeAdd is in _arrTimeBranch
    if (!_arrTimeBranch.includes(startTimeArrayAdd[1]) || !_arrTimeBranch.includes(endTimeArrayAdd[1])) {
        return res.status(400).send({
            success: false,
            messageEn: 'this time not available!',
            message: 'Thời gian này không mở cửa',
        })
    }


    let arrTime = createArrayTime(startDateTimeAdd, endDateTimeAdd)
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
            messageEn: 'Missing information',
            message: 'Thiếu thông tin',
        })
    }
    //check startDate and endDate in format dd/MM/yyyy regex
    const regex = /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/
    if (!regex.test(startDate) || !regex.test(endDate)) {
        return res.status(400).send({
            success: false,
            messageEn: 'StartDate and EndDate must be in format dd/MM/yyyy',
            message: 'Ngày bắt đầu và ngày kết thúc phải đúng định dạng dd/MM/yyyy',
        })
    }

    //check startDate > endDate
    _startDate = convertStringToDate(startDate)
    _endDate = convertStringToDate(endDate)

    if (_startDate > _endDate) {
        return res.status(400).send({
            success: false,
            messageEn: 'StartDate must be less than EndDate',
            message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc',
        })
    }

    if(!isAdmin){
        let pitchBranchId = req.query.pitchBranchId
        if(!pitchBranchId){
            return res.status(400).send({
                success: false,
                messageEn: 'Missing information',
                message: 'Thiếu thông tin',
            })
        }
        //check pitchBranchId is MongoId
        if (!mongoose.Types.ObjectId.isValid(pitchBranchId)) {
            return res.status(400).send({
                success: false,
                messageEn: 'pitchBranchId is not valid',
                message: 'pitchBranchId không hợp lệ',
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

//const 
function createArrayTime(startDateTimeAdd,endDateTimeAdd){// create array Time continues of bookingDetail request result like [ '08:00', '08:30', '09:00', '09:30', '10:00' ]
    let arrTime = []
    // first of array
    let c = startDateTimeAdd
    let hour = c.getHours() 
    if(hour < 10)
        hour = '0' + hour
    let min = c.getMinutes()
    if(min < 10)
        min = '0' + min
    let time = hour + ':' + min
    arrTime.push(time)
    // to end of array
    do{
        let d = new Date(c.getTime() + 30 * 60000)
        let hour = d.getHours()
        if(hour < 10)
            hour = '0' + hour
        let min = d.getMinutes()
        if(min < 10)
            min = '0' + min
        let time = hour + ':' + min
        arrTime.push(time)
        c = d
    }while(c.getTime() < endDateTimeAdd.getTime());
    return arrTime
}

module.exports = { validatePost, validateDelete, validatePut
    , validateGetByID, validateResult, validatePostFunction
    , validateCheckout, validateCheckoutFunction
    , validatePostConfirm, validatePostConfirmFunction, validatePutCheckinFunction
    , validatePutCancelFunction, validatePutRefreshFunction, validatePostStaticFunction,validatePutCancelOwnerFunction }