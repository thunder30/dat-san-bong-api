const express = require('express')
const router = express.Router()
const PitchType = require('../models/pitchType')
const { verifyToken } = require('../middlewares/auth')
const {
    validatePost,
    validatePut,
    validateDelete,
    validateGetById
} = require('../middlewares/pitchType')
const PitchBranch = require('../models/pitchBranch')


/**
 * @POST /api/pitchType
 * @description Create a new pitchType
 */
router.post('/', verifyToken, validatePost, async (req, res) => {
   try{
       //trim request body
        req.body.displayName = req.body.displayName.trim()
        req.body.description = req.body.description.trim()
        
        const pitchType = new PitchType({
            ...req.body
        })

        // save to database
        let _pitchType = await pitchType.save()
        res.status(201).json({
            success: true,
            message: 'Create successfully!',
            _pitchType,
        })

   }
    catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})

/**
 * @PUT /api/pitchType/:id
 * @description Update a pitchType
 */
router.put('/:id', verifyToken, validatePut, async (req, res) => {
    try{

        req.body.displayName = req.body.displayName.trim()
        req.body.description = req.body.description.trim()




        const { id } = req.params.id
        const pitchType = {
            ...req.body
        }

        const _pitchType = await PitchType.findOneAndUpdate(id, pitchType, { new: true })
        res.status(200).json({
            success: true,
            message: 'Update successfully!',
            _pitchType,
        })
        
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})

/**
 * @DELETE /api/pitchType/:id
 * @description Delete a pitchType
 */
router.delete('/:id', verifyToken, validateDelete, async (req, res) => {
    try{

        const { id } = req.params.id
        const _pitchType = await PitchType.findOneAndDelete(id)
        res.status(200).json({
            success: true,
            message: 'Delete successfully!',
            _pitchType,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})


/**
 * @GET /api/user/:id
 * @description Get all pitchType of user
 */
 router.get('/user/:id', verifyToken, async (req, res) => {
    try{

        //get pitchBrand of user
        const pitchBranches = await PitchBranch.find({ owner: req.params.id })
        const {owner} = pitchBranches[0]
        const pitchTypes = await PitchType.find({ pitchBranch: pitchBranches.owner })
        
        console.log(pitchBranches)
        console.log(owner.toString())
        // console.log(pitchTypes)

        const pitchType = await PitchType.find({}).populate
        ({
            path: 'pitchBranch',
            select: '_id',
            populate: {
                path: 'owner', 
                select: '_id',
                where: {owner: req.params.id}
            }
        })
        res.status(200).json({
            success: true,
            message: 'Get successfully!',
            pitchType,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})

/**
 * @GET /api/pitchType/:id
 * @description Get a pitchType by id
 */
router.get('/:id', verifyToken, validateGetById, async (req, res) => {
    try{

        let _pitchType = await PitchType.findById(req.params.id).populate('pitchBranch')
        res.status(200).json({
            success: true,
            message: 'Get successfully!',
            _pitchType,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})



/**
 * @GET /api/pitchType
 * @desc Get all pitchTypes
 */
 router.get('/', verifyToken, async (req, res) => {

    try{
        const pitchTypes = await PitchType.find({})
        res.status(200).json({
            success: true,
            message: 'Get all pitchType',
            pitchTypes,
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
    
    
})

module.exports = router
