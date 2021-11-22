const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')
const {
    validatePost,
    validateGetByID,
    validatePut,
    validateDelete,
} = require('../middlewares/booking')
const Booking = require('../models/Booking')

/**
 * @POST /api/booking
 * @desc Create a new booking
 */
router.post('/', verifyToken, validatePost, async (req, res) => {
    try {

        

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
 * @GET /api/booking?customerId=:customerId
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
            let bookings = await Booking.find()
            return res.status(200).json({ 
                success: true,
                message: 'Get all bookings successfully!',
                bookings
            })
        }
        const customerId = req.query.customerId

        if(!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Bad request',
            })
        }

        let bookings = await Booking.find({customer : customerId})
        return res.status(200).json({
            success: true,
            message: 'Get successfully!',
            bookings
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


module.exports = router