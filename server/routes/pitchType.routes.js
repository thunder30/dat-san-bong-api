const express = require('express')
const router = express.Router()
const PitchType = require('../models/pitchType')
const { verifyToken } = require('../middlewares/auth')
const {
    validatePost,
    validatePut,
    validateDelete,
    validateGetById,
    validateGetByBranch
} = require('../middlewares/pitchType')
const PitchBranch = require('../models/pitchBranch')


/**
 * @POST /api/pitchType
 * @description Create a new pitchType
 */
router.post('/', verifyToken, validatePost, async (req, res) => {
   try{
      
        const { isAdmin, userId } = req.payload
        
        //check if branch of user is owner
        const _pitchBranch = await PitchBranch.find({})
        .where('owner').equals(userId)
        .select('_id')
        .populate(
            {
                path: 'owner',
                select: 'id',
                match: {owner: userId}
            }
        )

        console.log(_pitchBranch)

        const isOwner = _pitchBranch.some((value,index) => {
            return value._id.toString() === req.body.pitchBranch
        })

        if(!isOwner && !isAdmin){
            return res.status(403).json({
                success: false,
                message: 'You are not owner of this branch!',
            })
        }

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
        const { id } = req.params.id
        const { isAdmin, userId } = req.payload
        
        //check if branch of user is owner
        const _pitchBranch = await PitchBranch.find({})
        .where('owner').equals(userId)
        .select('_id')
        .populate(
            {
                path: 'owner',
                select: 'id',
                match: {owner: userId}
            }
        )

        let isOwner
        isOwner = _pitchBranch.some((value,index) => {
            return value._id.toString() === req.body.pitchBranch
        })

        if(!isOwner && !isAdmin){
            return res.status(403).json({
                success: false,
                message: 'You are not owner of this branch!',
            })
        }
    
        delete req.body.pitchBranch

        const _pitchType = await PitchType.findOneAndUpdate(id, req.body, { new: true })
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
        // //check if branch of user
        const id = req.params.id
        const { isAdmin, userId } = req.payload
        const _pitchType = await PitchType.findById(id)
        .where('owner').equals(userId)
        .populate(
                path = 'pitchBranch',
                select = 'owner',
                match = {owner: userId}
        )
        console.log(userId)
        console.log(_pitchType.pitchBranch)
        if(!_pitchType.pitchBranch){
            return res.status(403).json({
                success: false,
                message: 'You are not owner of this branch!',
            })
        }
        // delete from database _pitchType
        const pitchTypeDel = await PitchType.findByIdAndDelete(id)

        // const _pitchType = await PitchType.findOneAndDelete({ _id: req.params.id })
        if(!pitchTypeDel){
            return res.status(404).json({
                success: false,
                message: 'PitchType not found!',
            })
        }
        res.status(200).json({
            success: true,
            message: 'Delete successfully!',
            pitchTypeDel,
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
 * @GET /api/pitchType?branchId=id
 * @description Get all pitchType of branch
 */
 router.get('/', verifyToken, validateGetByBranch, async (req, res) => {
    try{

        console.log(req.query)
        //if req.query isEmpyuy
        if(Object.keys(req.query).length === 0){
            //get all pitchType
            let _pitchType = await PitchType.find({})
            //return nos veef
            return res.status(200).json({
                success: true,
                message: 'Get all pitchType successfully!',
                _pitchType,
            })
        }

        if(!req.query.branchId){
            return res.status(400).json({
                success: false,
                message: 'Bad request!',
            })
        }

        //check if branch of user
        const  id = req.query.branchId
        const { isAdmin, userId } = req.payload
        const _pitchBranch = await PitchBranch.find({})
        .where('owner').equals(userId)
        .select('_id')
        .populate(
            {
                path: 'owner',
                select: 'id',
                match: {owner: userId}
            }
        )
        let isOwner
        isOwner = _pitchBranch.some((value,index) => {
            return value._id.toString() === id
        })

        if(!isOwner && !isAdmin){
            return res.status(403).json({
                success: false,
                message: 'You are not owner of this branch!',
            })
        }

        const pitchType = await PitchType.find({})
        .where('pitchBranch').equals(id)
        .populate
        ({
            path: 'pitchBranch',
            select: '_id',
            match : { pitchBranch: id },
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



// /**
//  * @GET /api/pitchType
//  * @desc Get all pitchTypes
//  */
//  router.get('/', verifyToken, async (req, res) => {

//     try{
//         const { isAdmin, userId } = req.payload
//         if(!isAdmin){
//             return res.status(403).json({
//                 success: false,
//                 message: 'You are not admin!',
//             })
//         }

//         const pitchTypes = await PitchType.find({})
//         res.status(200).json({
//             success: true,
//             message: 'Get all pitchType',
//             pitchTypes,
//         })
//     }
//     catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error!',
//             error,
//         })
//     }
    
    
// })

module.exports = router
