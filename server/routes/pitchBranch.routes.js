const express = require('express')
const router = express.Router()
const PitchBranch = require('../models/PitchBranch')
const {
    validatePost,
    validateGetById,
    validateGetByUserId,
    validatePut,
    validateDelete,
} = require('../middlewares/pitchBranch')
const { verifyToken } = require('../middlewares/auth')
const User = require('../models/User')
const Role = require('../models/Role')

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

        /**Nếu khách hàng tạo sân bóng thì khách hàng sẽ trở thành chủ sân */
        // find user by id
        const user = await User.findById(req.body.owner).populate('roles')

        //make flat array user by code
        const userRoles = user.roles.map((role) => role.code)
        console.log(userRoles)

        //if userroles is CHU_SAN
        if (!userRoles.includes('CHU_SAN')) {
            //update user roles by code CHU_SAN
            const dbRoles = await Role.find({ code: { $in: ['CHU_SAN'] } })
            await User.findOneAndUpdate(
                { _id: req.body.owner },
                {
                    $push: {
                        roles: dbRoles.map((role) => role._id),
                    },
                },
                { new: true }
            )
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
 * @GET /api/pitchBranch/owner/:id
 * @description Get a pitchBranch by owner
 */
router.get('/owner/:id', verifyToken, validateGetByUserId, async (req, res) => {
    try {
        const { isAdmin, userId } = req.payload
        // lấy pitchBranch theo params và theo payload id của user
        let pitchBranch = await PitchBranch.find({})
            .where('owner')
            .equals(userId)
            .where('owner')
            .equals(req.params.id)
            .populate((path = 'owner'), (match = { owner: req.payload.userId }))

        if (pitchBranch.length === 0 && !isAdmin) {
            return res.status(404).json({
                success: false,
                message: 'Not found',
            })
        }

        // if isAdmin
        if (isAdmin) {
            pitchBranch = await PitchBranch.find({})
                .where('owner')
                .equals(req.params.id)
                .populate(
                    (path = 'owner'),
                    (match = { owner: req.payload.userId })
                )
        }

        console.log(pitchBranch)
        res.status(200).json({
            success: true,
            message: 'Get pitchBranch successfully!',
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
 * GET /api/pitchBranch/:id
 * @description Get a pitchBranch by id
 */
router.get('/:id', verifyToken, validateGetById, async (req, res) => {
    try {
        const { isAdmin, userId } = req.payload
        // lấy pitchBranch theo params và theo payload id của user
        let pitchBranch = await PitchBranch.find({})
            .where('_id')
            .equals(req.params.id)
            .where('owner')
            .equals(userId)
            .populate((path = 'owner'), (match = { owner: req.payload.userId }))

        if (pitchBranch.length === 0 && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not found',
            })
        }
        // nếu là admin thì get luôn
        if (isAdmin) {
            pitchBranch = await PitchBranch.findById(req.params.id).populate(
                'owner'
            )
        }

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
        // const { owner } = req.body

        if (!isAdmin) {
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
        const { isAdmin, userId } = req.payload

        let pitchBranch = await PitchBranch.findById(req.params.id)
            .where('owner')
            .equals(userId)
            .populate((path = 'owner'), (match = { owner: req.payload.userId }))

        if (isAdmin) {
            pitchBranch = await PitchBranch.findById(req.params.id).populate(
                (path = 'owner')
            )
        }

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
