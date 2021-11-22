const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')

const {
    validatePost,
    validatePut,
    validateDelete
} = require('../middlewares/bookingDetail')

const BookingDetail = require('../models/BookingDetail')

/**
 * @POST /api/bookingDetail
 * @desc Create a new bookingDetail
 */
router.post('/', verifyToken, validatePost, async (req, res) => {
    try {
        const bookingDetail = new BookingDetail(req.body)
        const _bookingDetail = await bookingDetail.save()
        res.status(201).send({
            success: true,
            message: 'Create bookingDetail successfully!',
            _bookingDetail
        })
    } catch (error) {
        res.status(400).send(error)
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

module.exports = router