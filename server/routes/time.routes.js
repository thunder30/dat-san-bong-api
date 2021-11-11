const express = require('express')
const router = express.Router()
const Time = require('../models/Time')
const {
    validatePost,
    validatePut,
    validateDelete, 
    validateGetOneTime,
} = require('../middlewares/time')
const { verifyToken } = require('../middlewares/auth')

/**
 * @GET /api/time
 * @desc Get all times
 */
router.get('/',verifyToken ,async (req, res) => {
   
    try {
        const times = await Time.find()
        if(times.length ===0) {
            return res.status(404).json({ 
                success: false,
                message: 'No times found'
            })
        }
        res.status(200).json({
            success: true,
            message: 'Get all times',
            times,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            err,
        })
    }

})

/**
 * @POST /api/time
 * @desc Create a new time
 */
router.post('/',verifyToken, validatePost, async (req, res) => {
    try {
        const {code,startTime,endTime,description} = req.body

        // if code already exists
        const _code = await Time.findOne({code})
        if(_code) {
            return res.status(400).json({
                success: false,
                message: 'Code already exists!'
            })
        }

        //Create new time
        const newTime = new Time({
                code,
                startTime,
                endTime,
                description,
            })
        const time = await newTime.save()
        res.status(200).json({
            success: true,
            message: 'Create successfully!',
            time,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})

/**
 * @PUT /api/time/:id
 * @desc Update a time
 */
router.put('/:id',verifyToken, validatePut ,async (req, res) => {
    try {
        const {code,startTime,endTime,description} = req.body

        // Update to mongoDB
        const newTime = await Time.findOneAndUpdate(
            { _id: req.params.id },
            {
                startTime,
                endTime,
                description,
            },
            { new: true }
        )

        if(!newTime) {
            return res.status(404).json({
                success: false,
                message: 'Time not found!'
            })
        }
        res.status(200).json({
            success: true,
            message: 'Update successfully!',
            newTime,
        })
    
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})

/**
 * @DELETE /api/time/:id
 * @desc Delete a time
 */
router.delete('/:id', verifyToken, validateDelete,async (req, res) => {
    try {
        const time = await Time.findOneAndDelete({_id: req.params.id})
        if(!time) 
            return res.status(400).json({
                success: false,
                message: 'Time not found!'
            })
        res.status(200).json({
            success: true,
            message: 'Delete successfully!',
            time,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})

/**
 * @GET /api/time/:id
 * @desc Get a time
 */
router.get('/:id', verifyToken, validateGetOneTime, async (req, res) => {
    try {
        const time = await Time.findOne({_id: req.params.id})
        res.status(200).json({
            success: true,
            message: 'Get successfully!',
            time,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})
  
module.exports = router