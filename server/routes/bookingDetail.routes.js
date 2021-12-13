const express = require('express')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')

const {
    validatePost,
    validatePut,
    validateDelete,
    validateResult,
    validatePostFunction,
    validatePostbyPitchType,
    validatePostbyPitchTypeFunction,
    validFunction
} = require('../middlewares/bookingDetail')

const BookingDetail = require('../models/BookingDetail')
const Pitch = require('../models/Pitch')

/**
 * @POST /api/bookingDetail/pitchType
 * @desc Create a new bookingDetail by pitchType
 */
router.post('/pitchType', verifyToken, validatePostbyPitchType(), validateResult, validatePostbyPitchTypeFunction, async (req, res) => {
    try {

        if (!req.body.pitch) {
            return res.status(400).json({
                success: false,
                messageEn: 'No pitch available!',
                message: 'Không có sân nào!'
            })
        }

        delete req.body.pitchType
        console.log(req.body)


        const _bookingDetail = new BookingDetail({
            ...req.body
        })
        const newBookingDetail = await _bookingDetail.save()
        res.status(201).json({
            success: true,
            messageEn: 'BookingDetail created successfully',
            message: 'Đặt sân thành công!',
            newBookingDetail
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình xử lý!',
            error: error.message
        })
    }
})


/**
 * @POST /api/bookingDetail
 * @desc Create a new bookingDetail
 */
router.post('/', verifyToken, validatePost(), validateResult, validatePostFunction, async (req, res) => {
    try {

        const bookingDetail = new BookingDetail(req.body)
        const _bookingDetail = await bookingDetail.save()
        res.status(201).send({
            success: true,
            messageEn: 'Create bookingDetail successfully!',
            message: 'Đặt sân thành công!',
            _bookingDetail
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình xử lý!',
            error: error.message
        })
    }
})

/**
 * @GET /api/bookingDetail/bookedTime?pitch=1253469125123
 * @desc Get Time booked by pitch
 */
router.get('/bookedTime', async (req, res) => {
    try {
        if(!req.query.pitch){
            return res.status(400).send({
                success: false,
                messageEn: 'No pitch available',
                message: 'Không có sân nào!'
            })
        }
        const { pitch } = req.query
        if (!ObjectId.isValid(pitch))
            return res.status(400).json({
                success: false,
                messageEn: 'pitch invalid',
                message: 'Sân không hợp lệ!'
            })
        let times = []
        const bookedTime = await BookingDetail.find({ pitch }).sort({ startTime: 1 })
        let time =[]
       
        for (let i = 0; i < bookedTime.length - 1; i++) {
            const start = convertStringToDate(bookedTime[i].startTime)
            const end = convertStringToDate(bookedTime[i].endTime)
            const startNext = convertStringToDate(bookedTime[i+1].startTime)
            const endNext = convertStringToDate(bookedTime[i+1].endTime)
            // get current time
            time.push({
                startTime: bookedTime[i].startTime.split(' ')[1],
                endTime: bookedTime[i].endTime.split(' ')[1]
            })
            //if current time == next time => push to Time
            if(start.getTime() === startNext.getTime()){
                // pop last time
                time.pop()
                time.push({
                    startTime: bookedTime[i].startTime.split(' ')[1],
                    endTime: bookedTime[i].endTime.split(' ')[1]
                })
            // if current time != next time => push to big array Times
            }else{
                times.push({
                    date: start.getDate() + '/' + (start.getMonth() + 1) + '/' + start.getFullYear() ,
                    time
                })
                time = []
            }
            // take the last time in bookedTime and push to big array
            if(i+2 === bookedTime.length){
                let _startTime = convertStringToDate(bookedTime[i+1].startTime)
                console.log(_startTime.getTime() + " "+ startNext.getTime())
                // for case same last time and last time -1 is same day
                if(_startTime.getTime() == start.getTime()){
                    time.push({
                        startTime: bookedTime[i+1].startTime.split(' ')[1],
                        endTime: bookedTime[i+1].endTime.split(' ')[1]
                    })
                    times.push({
                        date: start.getDate() + '/' + (start.getMonth() + 1) + '/' + start.getFullYear()  + "ngu",
                        time
                    })
                    time = []
                }else
                {
                    time = []
                    time.push({
                        startTime: bookedTime[i+1].startTime.split(' ')[1],
                        endTime: bookedTime[i+1].endTime.split(' ')[1],
                    })
                    times.push({
                        date: _startTime.getDate() + '/' + (_startTime.getMonth() + 1) + '/' + _startTime.getFullYear(),
                        time
                    })
                }
            }
        }

        let _times = []
        // compare to take the day after now and before 14 days
        for (let i = 0; i < times.length; i++) {
            let day = convertStringToDay(times[i].date)
            // declare now date only day
            let now = new Date()
            now.setHours(0, 0, 0, 0)
            //now flus 17 days
            let nowPlusDays = now.setDate(now.getDate() + 14)
            if(day >= Date.now() && day < nowPlusDays){
                _times.push(times[i])
            }
        }

        res.status(200).send({
            success: true,
            messageEn: 'Get bookedTime successfully!',
            message: 'Lấy thời gian đặt sân thành công!',
            times: _times
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình xử lý!',
            error: error.message
        })
    }
})

/**
 * @GET /api/bookingDetail
 * @desc Get all bookingDetails
 */
router.get('/', verifyToken, async (req, res) => {
    try {

        const bookingDetails = await BookingDetail.find()
        .populate(
            path = 'status booking pitch',
        )
        res.status(200).send({
            success: true,
            messageEn: 'Get all bookingDetails successfully!',
            message: 'Lấy tất cả bookingDetails thành công!',
            bookingDetails
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình xử lý!',
            error: error.message
        })
    }
})

/**
 * @PUT /api/bookingDetail/:id
 * @desc Update a bookingDetail
 */
router.put('/:id', verifyToken, validatePut, async (req, res) => {
    try {
        const bookingDetail = await BookingDetail.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        })
        res.status(200).send({
            success: true,
            messageEn: 'Update bookingDetail successfully!',
            message: 'Cập nhật bookingDetail thành công!',
            bookingDetail
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình xử lý!',
            error: error.message
        })
    }
})

/**
 * @DELETE /api/bookingDetail/:id
 * @desc Delete a bookingDetail
 */
router.delete('/:id', verifyToken, validateDelete, async (req, res) => {
    try {
        const bookingDetail = await BookingDetail.findByIdAndDelete(req.params.id)
        res.status(200).send({
            success: true,
            messageEn: 'Delete bookingDetail successfully!',
            message: 'Xóa bookingDetail thành công!',
            bookingDetail
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình xử lý!',
            error: error.message
        })
    }
})

/**
 * @DELETE /api/bookingDetail/:id
 * @desc Delete a bookingDetail
 */
router.delete('/:id', verifyToken, validateDelete, async (req, res) => {
    try {
        const bookingDetail = await BookingDetail.findByIdAndDelete(req.params.id)
        res.status(200).send({
            success: true,
            messageEn: 'Delete bookingDetail successfully!',
            message: 'Xóa bookingDetail thành công!',
            bookingDetail
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình xử lý!',
            error: error.message
        })
    }
})

function convertStringToDate(s) {
    const splDayTime = s.split(' ')
    const splDay = splDayTime[0].split('/')
    const dateTime = new Date(splDay[2], splDay[1] - 1, splDay[0])
    return dateTime
}
function convertStringToDay(s) {
    const splDay = s.split('/')
    const dateTime = new Date(splDay[2], splDay[1] - 1, splDay[0])
    return dateTime
}

module.exports = router