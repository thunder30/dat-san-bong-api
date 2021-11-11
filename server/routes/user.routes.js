const express = require('express')
const { verifyToken } = require('../middlewares/auth.middleware')
const router = express.Router()
const User = require('../models/User')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

/**
 * @GET /api/user
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const { isAdmin } = req.payload
        if (!isAdmin)
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access',
            })
        const users = await User.find({})
        res.status(200).json({
            success: true,
            message: 'Successfully!',
            users,
        })
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error!',
            error,
        })
    }
})

/**
 * @GET /api/users/id
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const id = req.params.id
        const { userId, isAdmin } = req.payload

        // check id
        if (!ObjectId.isValid(id))
            return res.status(400).json({
                success: false,
                message: 'User is not found!',
            })

        const user = await User.findById(id)
        //console.log(user)

        if (!user)
            return res.status(400).json({
                success: false,
                message: 'User is not found!',
            })

        if (user._id === userId || isAdmin) {
            res.status(200).json({
                success: true,
                message: 'Successfully!',
                user,
            })
        } else {
            res.status(400).json({
                success: false,
                message: 'User is not found!',
            })
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})

module.exports = router
