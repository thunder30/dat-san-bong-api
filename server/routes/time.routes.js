const express = require('express')
const router = express.Router()
const Time = require('../models/Time')

/**
 * @GET /api/time
 * @desc Get all times
 */
router.get('/', async (req, res) => {
   
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
router.post('/', async (req, res) => {
    const {code,start_Time,end_Time,description} = req.body
    try {
        //Check if not empty
        if(!code || !start_Time || !end_Time) {
            return res.status(400).json({
                success: false,
                message: 'Argument not found!'
            })
        }

        // if code already exists
        const _code = await Time.findOne({code})
        if(_code) {
            return res.status(400).json({
                success: false,
                message: 'Code already exists!'
            })
        }

        //validate start_Time and end_Time
        const start_Time_validate = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/
        const end_Time_validate = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/
        if(!start_Time_validate.test(start_Time) || !end_Time_validate.test(end_Time)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time format!'
            })
        }

        //Create new time
        var newTime
            newTime = new Time({
                code,
                start_Time,
                end_Time,
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
 * @PUT /api/time/
 * @desc Update a time
 */
router.put('/', async (req, res) => {
    try {
        const {code,start_Time,end_Time,description} = req.body
        //Check if not empty
        if(!code || !start_Time || !end_Time) {
            return res.status(400).json({
                success: false,
                message: 'Argument not found!'
            })
        }
        
        // Update to mongoDB
        const newTime = await Time.findOneAndUpdate(
            { code: code },
            {
                code,
                start_Time,
                end_Time,
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
 * @DELETE /api/time/:code
 * @desc Delete a time
 */
router.delete('/:code', async (req, res) => {
    try {
        const time = await Time.findOneAndDelete({code: req.params.code})
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
  
module.exports = router