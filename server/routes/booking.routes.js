const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')
const {
    validatePost,
    validateGetByID,
    validatePut,
    validateDelete,
    validateResult,
    validatePostFunction,
    validateCheckout,
    validateCheckoutFunction,
    validatePostConfirmFunction,
    validatePostConfirm,
    validatePutCheckinFunction,
    validatePutCancelFunction,
    validatePutRefreshFunction
} = require('../middlewares/booking')
const sendmail = require('../helpers/mailerBooked')
const Booking = require('../models/Booking')
const BookingDetail = require('../models/BookingDetail')
const User = require('../models/User')
const Pitch = require('../models/Pitch')
const Status = require('../models/Status')
const { where } = require('../models/User')

/**
 * @POST /api/booking/checkout
 * @desc check booking
 */
router.post('/checkout', verifyToken, validateCheckout(), validateResult, validateCheckoutFunction, async (req, res) => {
    try {
        const { startTime, endTime, customer, pitch } = req.body

        res.status(200).json({
            success: true,
            message: 'success',
            price: req.body.price,
        })

    }catch(err){
        res.status(400).json({
            success: false,
            message: err.message
        })
    }
})

/**
 * @POST /api/booking/confirm
 * @desc confirm booking
 */
router.post('/confirm', verifyToken, validatePostConfirm(), validateResult, validatePostConfirmFunction, async (req, res) => {
    try {
        //create new booking
        const { startDate, endDate, price, customer, pitch, startTime, endTime, status, address, pitchName, receiver } = req.body

        const booking = new Booking({
            startDate,
            endDate,
            total: price,
            ispaid: true,
            customer,
        })

        const newBooking = await booking.save()

        //create new bookingDetail
        const bookingDetail = new BookingDetail({
            booking: newBooking._id,
            pitch,
            startTime,
            endTime,
            status,
            price,
        })
        const newBookingDetail = await bookingDetail.save()

        const code = newBookingDetail._id.toString().substring(newBookingDetail._id.toString().length - 6)
        
        //update user
        const user = await Pitch.findOne({ _id: pitch })
        .populate({
            path: 'pitchType',
            select : 'pitchBranch',
            populate: {
                path: 'pitchBranch',
                select: 'owner',
                populate: {
                    path: 'owner',
                    // select: '_id name email phone users'
                }
            }
        })
        let checkRepeatUser = false
        for(let i = 0; i < user.pitchType.pitchBranch.owner.users.length; i++){
            if(user.pitchType.pitchBranch.owner.users[i]._id.toString() === customer.toString()){
                check = true
                break
            }
        }

        if(!checkRepeatUser){
            const userUpdate = await User.findOneAndUpdate({ _id: user.pitchType.pitchBranch.owner._id.toString() }, { $push: { users: customer } }, { new: true })
        }

        res.status(200).json({
            success: true,
            message: 'success',
            Booking: newBooking,
            BookingDetail: newBookingDetail,
            code,
        })

        sendmail(receiver,code,startTime,endTime,address,pitchName,price)

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
})

/**
 * @POST /api/booking
 * @desc Create a new booking
 */
router.post('/', verifyToken, validatePost(), validateResult, validatePostFunction, async (req, res) => {
    try {
        const { isAdmin, userId } = req.payload

        const booking = new Booking({
            ...req.body,
        })
        const _booking = await booking.save()
        res.status(201).json({
            success: true,
            message: 'Create successfully!',
            _booking
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @PUT /api/booking/checkin/:id
 * @desc update status by a bookingDetail code
 */
 router.put('/checkin/:id', verifyToken, validatePutCheckinFunction, async (req, res) => {
    try {

        const status = req.body.status
        const statusId = await Status.findOne({ status: status })
        if(!req.body.bookingDetailId){
            return res.status(404).json({
                success: false,
                message: 'Not found',
            })
        }
        let bookingDetailUpdate = await BookingDetail.findOneAndUpdate(
            { 
                _id: req.body.bookingDetailId
            }, 
            { status: statusId._id }, 
            { new: true })
            .select('status startTime endTime price booking pitch')
            // console.log(bookingDetail[i]._id)
        
        res.status(200).json({
            success: true,
            message: 'Update successfully!',
            bookingDetailUpdate
        })


    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @PUT /api/booking/cancel/:id
 * @desc update status by a bookingDetail code
 */
router.put('/cancel/:id', verifyToken, validatePutCancelFunction, async (req, res) => {
    try {
        
        const status = req.body.status
        const bookingDetailId = req.params.id
        const statusId = await Status.findOne({ status: status })

        let bookingDetailUpdate = await BookingDetail.findOneAndUpdate(
            { 
                _id: bookingDetailId
            }, 
            { status: statusId._id }, 
            { new: true })
        
        res.status(200).json({
            success: true,
            message: 'Update successfully!',
            bookingDetailUpdate
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @PUT /api/booking/:id
 * @desc Update a booking by id
 */
router.put('/:id', verifyToken, validatePut, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        })
        return res.status(200).json({
            success: true,
            message: 'Update successfully!',
            booking
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @PUT /api/booking/refresh/:id
 * @desc Update a booking by branch id
 */
router.put('/refresh/:id', validatePutRefreshFunction, async (req, res) => {
    try {
        // const bookingDetail = await BookingDetail.find({})
        // .populate({
        //     path: 'pitch',
        //     populate: {
        //         path: 'pitchType',
        //         match: { pitchBranch: req.params.id },
        //     }
        // })

        // for(let i = 0; i < bookingDetail.length; i++){
        //     if(bookingDetail[i].pitch.pitchType !== null){

        //     }
        // }



        // console.log(bookingDetail)

        return res.status(200).json({
            success: true,
            message: 'Update successfully!',
            bookingDetail
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @DELETE /api/booking/:id
 * @desc Delete a booking by id
 */
router.delete('/:id', verifyToken, validateDelete, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id)
        return res.status(200).json({
            success: true,
            message: 'Delete successfully!',
            booking
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})


/**
 * @GET /api/booking/pitchbranch/:id
 * @desc Get a booking by branch id
 */


/**
 * @GET /api/booking/:id
 * @desc Get a booking by id
 */
 router.get('/:id', verifyToken, validateGetByID, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
        return res.status(200).json({
            success: true,
            message: 'Get successfully!',
            booking
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @GET /api/booking?customerId=:customerId?pitchBranchId=:pitchBranchId
 * @desc Get all bookings
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        if(Object.keys(req.query).length === 0) {
            //check if user is admin
            const isAdmin = req.payload.isAdmin
            if(!isAdmin){
                return res.status(403).json({
                    success: false,
                    message: 'You are not Admin !',
                })
            }
            let bookings = await BookingDetail.find()
            .populate({
                path: 'booking',
                select: '-createdAt -updatedAt -__v',
                populate: {
                    path: 'customer',
                    select: 'name email phoneNumber'
                }
            })
            return res.status(200).json({ 
                success: true,
                message: 'Get all bookings successfully!',
                bookings
            })
        }
        const customerId = req.query.customerId
        const pitchBranchId = req.query.pitchBranchId

        if(!customerId && !pitchBranchId) {
            return res.status(400).json({
                success: false,
                message: 'Bad request',
            })
        }

        if(pitchBranchId) {
            const bookingDetail = await BookingDetail.find({})
            .populate({
                path: 'pitch',
                select: '_id',
                populate: {
                    path: 'pitchType',
                    select: '_id',
                    populate: {
                        path: 'pitchBranch',
                        
                        // match: {owner : ownerId}
                    }
                },
            })

            // Get all booking detail by pitchBranchId
            let b = []
            for(let i = 0; i < bookingDetail.length; i++) {
                if(bookingDetail[i].pitch.pitchType.pitchBranch._id.toString() === pitchBranchId && bookingDetail[i].pitch.pitchType.pitchBranch.owner.toString() === req.payload.userId) {
                    b.push(bookingDetail[i]._id)
                }
            }

            // Get all booking by bookingDetailId
            let c = []
            for(let i = 0; i < b.length; i++) {
                const booking = await BookingDetail
                .find({ _id:b[i].toString() }).populate({
                    path : 'booking',
                    populate: {
                        path: 'customer',
                        select: '_id email firstName lastName',
                    }
                })
                c[i] = booking
            }

            return res.status(200).json({
                success: true,
                message: 'Get bookings successfully!',
                bookings: c
            })
        }

        let customerIdd = '619dbcd6bc930d10be70a60e'
        
        let bookings = await BookingDetail.find({})

        .where('customer').equals(customerId)
        .populate({
            path: 'booking',
            populate: {
                path: 'customer',
                match: { _id: customerId },
                select: '_id',
            }
        })

        // console.log(bookings)

        let arrBookings = []

        for(let i = 0; i < bookings.length; i++) {
            if(bookings[i].booking.customer._id.toString() === customerId) {
                arrBookings.push(bookings[i])
                console.log(bookings[i])
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Get successfully!',
            bookings: arrBookings
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})


module.exports = router