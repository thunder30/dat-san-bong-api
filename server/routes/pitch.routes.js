const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')
const {
    validatePost,
    validateGetById,
    validatePut,
    validateDelete,
    validateGetByPitchType
} = require('../middlewares/pitch')
const Pitch = require('../models/Pitch')
const { route } = require('./price.routes')

/**
 * @POST /api/pitch
 * @desc Create a new pitch
 */
router.post('/', verifyToken, validatePost, async (req, res) => {
    try{
        //trim request body
        req.body.displayName = req.body.displayName.trim()
        req.body.description = req.body.description.trim()

        const pitch = new Pitch({
            ...req.body,
        })
        let _pitch = await pitch.save()
        res.status(201).json({
            success: true,
            message: 'Create successfully!',
            _pitch,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @GET /api/pitch
 * @desc Get all pitches
 */
router.get('/', verifyToken, async (req, res) => {
    try{

        //check if user is admin
        const {isAdmin} = req.payload.isAdmin
        if(!isAdmin){
            return res.status(403).json({
                success: false,
                message: 'You are not Admin !',
            })
        }

        let pitches = await Pitch.find()
        res.status(200).json({
            success: true,
            message: 'Get successfully!',
            pitches,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @GET /api/pitch/:id
 * @desc Get a pitch by id
 */
router.get('/:id', verifyToken, validateGetById, async (req, res) => {
    try{
        let pitch = await Pitch.findById(req.params.id).populate(path = 'pitchType', select = '-pitchBranch')
        res.status(200).json({
            success: true,
            message: 'Get successfully!',
            pitch,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @PUT /api/pitch/:id
 * @desc Update a pitch by id
 */
router.put('/:id', verifyToken, validatePut, async (req, res) => {
    try{
        //trim request body
        req.body.displayName = req.body.displayName.trim()
        req.body.description = req.body.description.trim()
        
        let pitch = await Pitch.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.status(200).json({
            success: true,
            message: 'Update successfully!',
            pitch,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @DELETE /api/pitch/:id
 * @desc Delete a pitch by id
 */
router.delete('/:id', verifyToken, validateDelete, async (req, res) => {
    try{
        let pitch = await Pitch.findByIdAndDelete(req.params.id)

        if(!pitch){
            return res.status(404).json({
                success: false,
                message: 'Pitch not found!',
            })
        }

        res.status(200).json({
            success: true,
            message: 'Delete successfully!',
            pitch,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @GET /api/pitch/pitchType/:id
 * @desc Get all pitches by pitchType
 */
router.get('/pitchType/:id', verifyToken, validateGetByPitchType, async (req, res) => {
    try{
        let pitches = await Pitch.find({ pitchType: req.params.id })
        res.status(200).json({
            success: true,
            message: 'Get successfully!',
            pitches,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})


module.exports = router