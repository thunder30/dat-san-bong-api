const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Role = require('../models/Role')
const { verifyToken } = require('../middlewares/auth')
const {
    validatePost,
    validatePut,
    validateGetById,
    validateDelete,
} = require('../middlewares/user')
const { sendMailVerify } = require('../helpers/mailVerify')
const { encrypt } = require('../utils/hashPassword')

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

/**
 * @PUT /api/users/:id
 */
router.put('/:id', verifyToken, validatePut, async (req, res) => {
    try {
        const { userId, isAdmin } = req.payload
        const id = req.params.id
        const { password, roles } = req.body

        if (!isAdmin && userId !== id) {
            return res.status(403).json({
                success: false,
                message: `You don't have permission to access`,
            })
        }
        // overwrite password
        if (password) req.body.password = encrypt(password)

        if (roles) {
            if (roles.length === 0) {
                delete req.body.roles
            } else {
                const dbRoles = await Role.find({ code: { $in: roles } })

                if (dbRoles.length !== roles.length)
                    return res.status(400).json({
                        success: false,
                        message: `A role doesn't exists at least`,
                    })

                req.body.roles = dbRoles.map((role) => role._id)

                // clear all role of user
                const _roles = await Role.find({})
                _roles.forEach(async (role) => {
                    const index = role.users.indexOf(id)
                    if (index !== -1) {
                        // remove
                        role.users.splice(index, 1)
                        await role.save()
                    }
                })

                // add user id for role
                dbRoles.forEach(async (role) => {
                    role.users.push(id)
                    await role.save()
                })
            }
        }

        // update user
        const user = await User.findByIdAndUpdate(id, req.body, { new: true })
        if (!user)
            return res.status(400).json({
                success: false,
                message: 'User not found!',
            })

        res.status(200).json({
            success: true,
            message: 'Update successfully!',
            user,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error,
        })
    }
})

/**
 * @DELETE /api/users/:id
 */
router.delete('/:id', verifyToken, validateDelete, async (req, res) => {
    try {
        const { isAdmin } = req.payload
        if (!isAdmin)
            return res.status(403).json({
                success: false,
                message: `You don't have permission to access`,
            })
        const user = await User.findByIdAndDelete(req.params.id)
        if (!user)
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })

        // update role

        const roles = user.roles
        const _roles = await Role.find({})
        _roles.forEach(async (role) => {
            if (roles.includes(role._id)) {
                const indexUser = role.users.indexOf(user._id)
                if (indexUser !== -1) {
                    role.users.splice(indexUser, 1)
                    await role.save()
                }
            }
        })

        res.status(200).json({
            success: true,
            message: 'Delete successfully!',
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
