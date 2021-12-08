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
                message: 'No pitch available'
            })
        }

        delete req.body.pitchType
        console.log(req.body)


        const _bookingDetail = new BookingDetail({
            ...req.body
        })
        const newBookingDetail = await _bookingDetail.save()
        res.status(201).json({
            message: 'BookingDetail created successfully',
            newBookingDetail
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            message: 'Internal server error!',
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
            message: 'Create bookingDetail successfully!',
            _bookingDetail
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            message: 'Internal server error!',
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
                message: 'No pitch available'
            })
        }
        const { pitch } = req.query
        if (!ObjectId.isValid(pitch))
            return res.status(400).json({
                success: false,
                message: 'pitch invalid',
            })
        let times = []
        const bookedTime = await BookingDetail.find({ pitch }).sort({ startTime: 1 })
        for (let i = 0; i < bookedTime.length; i++) {
            let time = {
                startTime: '',
                endTime: '',
            }
            const start = convertStringToDate(bookedTime[i].startTime)
            const end = convertStringToDate(bookedTime[i].endTime)
            //endtime + 7days
            const endTime = new Date(end.getTime() + 7 * 24 * 60 * 60 * 1000)
            // now +7days
            const nowPlus7Days = new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000)
            if (start.getTime() > Date.now() && start.getTime() < nowPlus7Days) {
                time.startTime = bookedTime[i].startTime
                time.endTime = bookedTime[i].endTime
                times.push(time)
            }
            

        }
        res.status(200).send({
            success: true,
            message: 'Get bookedTime successfully!',
            times
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            message: 'Internal server error!',
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
            message: 'Get all bookingDetails successfully!',
            bookingDetails
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            message: 'Internal server error!',
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
            message: 'Update bookingDetail successfully!',
            bookingDetail
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            message: 'Internal server error!',
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
            message: 'Delete bookingDetail successfully!',
            bookingDetail
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            message: 'Internal server error!',
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
            message: 'Delete bookingDetail successfully!',
            bookingDetail
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            message: 'Internal server error!',
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

module.exports = router