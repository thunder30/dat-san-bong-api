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
        const users = await User.find({}).populate({
            path: 'roles',
            select: 'code',
        })
        res.status(200).json({
            success: true,
            messageEn: 'Successfully!',
            message: 'Thành công!',
            users,
        })
    } catch (error) {
        res.status(500).json({
            messageEn: 'Internal server error!',
            message: 'Lỗi server!',
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
                messageEn: 'User not found!',
                message: 'Không tìm thấy người dùng!',
            })

        if (id === userId || isAdmin) {
            res.status(200).json({
                success: true,
                messageEn: 'Successfully!',
                message: 'Thành công!',
                user,
            })
        } else {
            res.status(403).json({
                success: false,
                messageEn: 'You do not have permission to access',
                message: 'Bạn không có quyền truy cập',
            })
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Lỗi server!',
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
                messageEn: 'You do not have permission to access',
                message: 'Bạn không có quyền truy cập',
            })

        const _user = await User.findOne({ email })
        if (_user)
            return res.status(400).json({
                success: false,
                messageEn: 'User already exists!',
                message: 'Người dùng đã tồn tại!',
            })

        // get roles
        const dbRoles = await Role.find({ code: { $in: roles } })

        if (dbRoles.length !== roles.length)
            return res.status(400).json({
                success: false,
                messageEn: `A role doesn't exists at least`,
                message: `Vai trò không tồn tại ít nhất`,
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
            messageEn: 'Create user successfully!',
            message: 'Tạo người dùng thành công!',
            newUser,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error',
            message: 'Lỗi server!',
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
                messageEn: `You don't have permission to access`,
                message: `Bạn không có quyền truy cập`,
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
                        messageEn: `A role doesn't exists at least`,
                        message: `Vai trò không tồn tại`,
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
                messageEn: 'User not found!',
                message: 'Không tìm thấy người dùng!',
            })

        res.status(200).json({
            success: true,
            messageEn: 'Update successfully!',
            message: 'Cập nhật thành công!',
            user,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error',
            message: 'Lỗi server!',
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
                messageEn: `You don't have permission to access`,
                message: `Bạn không có quyền truy cập`,
            })
        const user = await User.findByIdAndDelete(req.params.id)
        if (!user)
            return res.status(404).json({
                success: false,
                messageEn: 'User not found',
                message: 'Không tìm thấy người dùng',
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
            messageEn: 'Delete successfully!',
            message: 'Xóa thành công!',
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error',
            message: 'Lỗi server!',
            error,
        })
    }
})

module.exports = router
