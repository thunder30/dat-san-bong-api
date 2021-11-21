const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')
const {
    validateDelete,
    validatePost,
    validatePut,
    validateGetByid,
} = require('../middlewares/price')
const Price = require('../models/Price')

/**
 * @POST /api/price
 * @desc Add new price
 */
router.post('/', verifyToken, validatePost, async (req, res) => {
    try{
        const { pitchType, time, price} = req.body
        const { isAdmin, userId } = req.payload

        // Check if user is admin
        const valPriceOwner = await Price.find({})
        .where('pitchType').equals(pitchType)
        .where('owner').equals(userId)
        .populate(
            {
                path: 'pitchType',
                populate: {
                    path: 'pitchBranch',
                    match: { owner: userId },
                }
            }
        )
        if(valPriceOwner.length === 0 && !isAdmin){
            return res.status(400).json({
                success: false,
                message: 'You are not owner of this PitchType!',
            })
        }
            
        // Check if price already exist
        const valprice = await Price.findOne({ pitchType, time })
        if(valprice) {
            return res.status(400).json({
                success: false,
                message: 'Price already exists',
            })
        }

        const newPrice = await Price.create({
            pitchType,
            time,
            price
        })

        return res.status(201).json(
            {
                success: true,
                message: 'Add new price success',
                newPrice
            }
        ) 
    }catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @PUT /api/price/:id
 * @desc Update price by id
 */
router.put('/:id', verifyToken, validatePut, async (req, res) => {
    try{
        const {id} = req.params
        const { isAdmin, userId } = req.payload


        const price = await Price.findByIdAndUpdate(id, req.body.price, {new: true})
        if(!price){
            return res.status(404).json({
                success: false,
                message: 'Price not found'
            })
        }
        return res.status(200).json(
            {
                success: true,
                message: 'Update price success',
                price
            }
        )

    }catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @DELETE /api/price/:id
 * @desc Delete price by id
 */
router.delete('/:id', verifyToken, validateDelete, async (req, res) => {
    try{
        const {id} = req.params
        await Price.findByIdAndDelete(id)
        return res.status(200).json(
            {
                success: true,
                message: 'Delete price success'
            }
        )
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
 * @GET /api/price/:id
 * @desc Get price by id
 */
 router.get('/:id', verifyToken, validateGetByid, async (req, res) => {
    try{
        const {id} = req.params
        const price = await Price.findById(id).populate(
            path = 'pitchType time',
            select = '-pitchBranch'
            )
        return res.status(200).json(
            {
                success: true,
                message: 'Get price success',
                price
            }
        )
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
 * @GET /api/price?pitchType=123
 * @desc Get price by pitchType
 */
router.get('/', verifyToken, async (req, res) => {
    try{
        const isAdmin = req.payload.isAdmin
        console.log(isAdmin)
        //if req.query isEmpty
        if(Object.keys(req.query).length === 0){
            if(!isAdmin){
                return res.status(403).json({
                    success: false,
                    message: 'You are not admin'
                })
            }
            //get all pitchType
            let _price = await Price.find({})
            //return 
            return res.status(200).json({
                success: true,
                message: 'Get all price successfully!',
                _price,
            })
        }

        const pitchTypeId = req.query.pitchType

        if(!pitchTypeId){
            return res.status(400).json({
                success: false,
                message: 'Bad request!',
            })
        }

        const prices = await Price.find({})
        .where('pitchType').equals(pitchTypeId)
        .populate({
            path: 'pitchType time',
            select: '-pitchBranch',
            match: {pitchType : pitchTypeId}
        })
        return res.status(200).json(
            {
                success: true,
                message: 'Get prices success',
                prices
            }
        )

    }catch(error){
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

module.exports = router