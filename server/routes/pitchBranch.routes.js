const express = require('express')
const router = express.Router()
const slugify = require('slugify')
const PitchBranch = require('../models/pitchBranch')
const {
    validatePost,
    validateGetById,
    validatePut,
    validateDelete,
} = require('../middlewares/pitchBranch')
const { verifyToken } = require('../middlewares/auth')

/**
 * @POST /api/pitchBranch
 * @description Create a new pitchBranch
 */
router.post('/', verifyToken, validatePost, async (req, res) => {
    try {
        // Verify isAdmin or isOwner
        const { isAdmin, userId } = req.payload
        const { owner } = req.body
        if (!isAdmin && userId !== owner) {
            return res.status(401).json({
                success: false,
                message: `You don't have permission`,
            })
        }

        const pitchBranch = new PitchBranch({
            ...req.body,
        })
        // save to db
        let _pitchBranch = await pitchBranch.save()
        res.status(201).json({
            success: true,
            message: 'Create successfully!',
            _pitchBranch,
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
 * GET /api/pitchBranch/:id
 * @description Get a pitchBranch by id
 */
router.get('/:id', verifyToken, validateGetById, async (req, res) => {
    try {
        // Verify isAdmin or isOwner
        const { isAdmin, userId } = req.payload
        const { owner } = req.body
        if (!isAdmin && userId !== owner) {
            return res.status(403).json({
                success: false,
                message: `You don't have permission`,
            })
        }

        const pitchBranch = await PitchBranch.findById(req.params.id).populate(
            'owner'
        )
        res.status(200).json({
            success: true,
            message: 'Get successfully!',
            pitchBranch,
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
 * @GET /api/pitchBranch/
 * @description Get all pitchBranch
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        // Verify isAdmin or isOwner
        const { isAdmin, userId } = req.payload
        const { owner } = req.body
        if (!isAdmin && userId !== owner) {
            return res.status(403).json({
                success: false,
                message: `You don't have permission`,
            })
        }

        const pitchBranch = await PitchBranch.find().populate({
            path: 'owner',
            select: '_id',
        })

        res.status(200).json({
            success: true,
            message: 'Get successfully!',
            pitchBranch,
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
 * @Delete /api/pitchBranch/:id
 * @description Delete a pitchBranch by id
 */
router.delete('/:id', verifyToken, validateDelete, async (req, res) => {
    try {
        // Verify isAdmin or isOwner
        const { isAdmin, userId } = req.payload
        const { owner } = req.body
        if (!isAdmin && userId !== owner) {
            return res.status(403).json({
                success: false,
                message: `You don't have permission`,
            })
        }

        const pitchBranch = await PitchBranch.findById(req.params.id)
        if (!pitchBranch) {
            return res.status(404).json({
                success: false,
                message: 'PitchBranch not found!',
            })
        }

        // delete
        await pitchBranch.remove()
        res.status(200).json({
            success: true,
            message: 'Delete successfully!',
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
 * @PUT /api/pitchBranch/:id
 * @description Update a pitchBranch by id
 */
router.put('/:id', verifyToken, validatePut, async (req, res) => {
    try {
        // Verify isAdmin or isOwner
        const { isAdmin, userId } = req.payload
        const { owner } = req.body
        if (!isAdmin && userId !== owner) {
            return res.status(403).json({
                success: false,
                message: `You don't have permission`,
            })
        }

        // find pitchBranch
        const pitchBranch = await PitchBranch.findById(req.params.id)
        if (!pitchBranch) {
            return res.status(404).json({
                success: false,
                message: 'PitchBranch not found!',
            })
        }

        // delete key
        delete req.body.owner

        // update
        await pitchBranch.updateOne(req.body)
        res.status(200).json({
            success: true,
            message: 'Update successfully!',
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