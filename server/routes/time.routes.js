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
 * @POST /api/time
 * @desc Create a new time
 */
router.post('/',verifyToken, validatePost, async (req, res) => {

    if(!req.payload.isAdmin){
        return res.status(400).json({ 
            success: false,
            message: `You don't have permission to access`
        })
    }

    try {
        const { code, startTime, endTime, description } = req.body

        // if code already exists
        const _time = await Time.findOne({code})
        if(_time) {
            return res.status(400).json({
                success: false,
                message: 'Time already exists!'
            })
        }

        //Create new time
        const time = new Time({
                code,
                startTime,
                endTime,
                description,
            })
        const newTime = await time.save()
        res.status(201).json({
            success: true,
            message: 'Create successfully!',
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
 * @PUT /api/time/:id
 * @desc Update a time
 */
router.put('/:id',verifyToken, validatePut ,async (req, res) => {
    
    if(!req.payload.isAdmin){
        return res.status(400).json({ 
            success: false,
            message: `You don't have permission to access`
        })
    }

    try {
        const {code, startTime, endTime, description } = req.body

        // Update to mongoDB
        const time = await Time.findOneAndUpdate(
            { _id: req.params.id },
            {
                code,
                startTime,
                endTime,
                description,
            },
            { new: true }
        )

        if(!time) {
            return res.status(400).json({
                success: false,
                message: 'Time not found!'
            })
        }
        res.status(200).json({
            success: true,
            message: 'Update successfully!',
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
 * @DELETE /api/time/:id
 * @desc Delete a time
 */
router.delete('/:id', verifyToken, validateDelete,async (req, res) => {

    if(!req.payload.isAdmin){
        return res.status(400).json({ 
            success: false,
            message: `You don't have permission to access`
        })
    }
    
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
 * @GET /api/times/genAllTimes
 * @desc Generate all times
 */
router.get('/reGenAllTimes', async (req, res) => {

    //delete all times
    await Time.deleteMany({})
    
    let count = 0;
    for(let i = 1; i <= 24; i++) {
        const time = new Time({
            code: `OT${count}`,
            startTime: `${i-1}:00`,
            endTime: `${i-1}:30`,
            description: `Bắt đầu lúc ${i-1}:00`,
        })
        await time.save()
        count++;
        const time2 = new Time({
            code: `OT${count}`,
            startTime: `${i-1}:30`,
            endTime: `${i}:00`,
            description: `Bắt đầu lúc ${i-1}:30`,
        })
        await time2.save()
        count++;
    }
    // let times = []
    // let startTime = `00:00`
    // for (let i = 1, y = 1; i <= 48; i++) {
    //     const endTime = `${i-1}:30`
    //     const time = {
    //         code: `OT${i}`,
    //         startTime,
    //         endTime,
    //     }
    
    //     startTime = endTime
    //     times.push(time)
    // }

    const times = await Time.find()

    res.status(200).json({
        success: true,
        message: 'Get successfully!',
        times,
    })

})


/**
 * @GET /api/time
 * @desc Get all times
 */
 router.get('/', verifyToken, async (req, res) => {
   
    if(!req.payload.isAdmin){
        return res.status(400).json({ 
            success: false,
            message: `You don't have permission to access`
        })
    }

    try {
        const times = await Time.find()
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
 * @GET /api/time/:id
 * @desc Get a time
 */
 router.get('/:id', verifyToken, validateGetOneTime, async (req, res) => {

    if(!req.payload.isAdmin){
        return res.status(400).json({ 
            success: false,
            message: `You don't have permission to access`
        })
    }

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