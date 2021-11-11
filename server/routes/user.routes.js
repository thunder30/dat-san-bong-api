const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Role = require('../models/Role')
const { verifyToken } = require('../middlewares/auth')
const {
    validatePost,
    validatePut,
    validateGetById,
} = require('../middlewares/user')
const { sendMailVerify } = require('../helpers/mailVerify')
const hashPassword = require('../utils/hashPassword')

/**
 * @GET /api/users
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
router.get('/:id', verifyToken, validateGetById, async (req, res) => {
    try {
        const id = req.params.id
        const { userId, isAdmin } = req.payload

        const user = await User.findById(id)
        //console.log(user)

        if (!user)
            return res.status(400).json({
                success: false,
                message: 'User not found!',
            })

        if (id === userId || isAdmin) {
            res.status(200).json({
                success: true,
                message: 'Successfully!',
                user,
            })
        } else {
            res.status(403).json({
                success: false,
                message: 'You do not have permission to access',
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

/**
 * @POST /api/users
 */
router.post('/', verifyToken, validatePost, async (req, res) => {
    try {
        const { email, password, roles, isAdmin } = req.body

        if (!req.payload.isAdmin)
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access',
            })

        const _user = await User.findOne({ email })
        if (_user)
            return res.status(400).json({
                success: false,
                message: 'User already exists!',
            })

        // get roles
        const dbRoles = await Role.find({ code: { $in: roles } })

        if (dbRoles.length !== roles.length)
            return res.status(400).json({
                success: false,
                message: `A role doesn't exists at least`,
            })

        const user = new User({
            ...req.body,
            password: hashPassword.encrypt(password),
            roles: dbRoles.map((role) => role._id),
            isAdmin: isAdmin === true ? true : false,
        })

        const newUser = await user.save()

        //update key users in Role collection
        dbRoles.forEach(async (role) => {
            role.users = [...role.users, newUser._id]
            await role.save()
        })

        // send email verify token
        sendMailVerify(req, email, newUser._id)

        res.status(201).json({
            success: true,
            message: 'Create user successfully!',
            newUser,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error,
        })
    }
})

module.exports = router
