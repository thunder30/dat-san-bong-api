const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const hashPassword = require('../utils/hashPassword')
const User = require('../models/User')
const Role = require('../models/Role')
const {
    validateLogin,
    validateRegister,
    emailVerifyToken,
    verifyToken,
    resetVerifyToken,
    validateResult,
} = require('../middlewares/auth')
const generateToken = require('../utils/generateToken')
const { sendMailVerify, sendMailReset } = require('../helpers/mailVerify')
const { isValidObjectId } = require('mongoose')
/**
 * @POST /api/auth/login
 * @desc
 */
router.post('/login', validateLogin(), validateResult , async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email }).populate('roles')

        if (!user)
            return res.status(400).json({
                success: false,
                messageEn: 'Wrong email or password!',
                message: 'Sai email hoặc mật khẩu!',
            })

        const originalPassword = hashPassword.decrypt(user.password)
        if (password !== originalPassword)
            return res.status(400).json({
                success: false,
                messageEn: 'Wrong email or password!',
                message: 'Sai email hoặc mật khẩu!',
            })

        // check email verify
        if (!user.isVerified) {
            sendMailVerify(req, email, user._id)
            return res.status(401).json({
                success: false,
                messageEn: 'User is not email verify. Please check my email.',
                message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email của bạn.',
            })
        }

        if (!user.isActived)
            return res.status(403).json({
                success: false,
                messageEn: 'The user is deactivated!',
                message: 'Tài khoản đã bị khóa!',
            })

        // generation access token
        const accessToken = generateToken(
            {
                userId: user._id,
                roles: user.roles.map((role) => role.code),
                isAdmin: user.isAdmin,
            },
            { expiresIn: '24h' }
        )

        // write log for login
        user.lastLogin = Date.now()
        user.accessToken = accessToken
        await user.save()

        res.status(200).json({
            success: true,
            messageEn: 'Login successfully!',
            message: 'Đăng nhập thành công!',
            accessToken,
            roles: user.roles.map((role) => role.code),
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error.',
            message: 'Lỗi server!',
            error,
        })
    }
})

/**
 * @POST /api/auth/register
 * @desc
 */
router.post('/register', validateRegister, async (req, res) => {
    try {
        // start create User
        const { email, password, roles, isAdmin } = req.body
        // get roles
        const dbRoles = await Role.find({ code: { $in: roles } })

        if (dbRoles.length !== roles.length)
            return res.status(400).json({
                success: false,
                messageEn: `A role doesn't exists at least`,
                message: `Vai trò không tồn tại!`,
            })

        const inputRoles = dbRoles.map((role) => role._id) // [46dac35, 3abd3c4, ...]

        /**
         * Kiểm tra email và vai trò
         * nếu email và tất cả vai trò đã tồn tại -> User already exists
         * nếu email tồn tại, có ít nhất 1 vai trò kh tồn tại -> cập nhật
         * nếu email không tồn tại -> thêm mới
         */

        let _user = await User.findOne({ email })
        if (_user) {
            // lọc role id không tồn tại
            const newRoles = dbRoles.filter((role) => {
                return !_user.roles.includes(role._id)
            })

            if (newRoles.length === 0)
                return res.status(422).json({
                    success: false,
                    messageEn: 'User already exists!',
                    message: 'Tài khoản đã tồn tại!',
                })

            // update user
            _user.roles = [..._user.roles, ...newRoles]

            await _user.save()
            return res.status(201).json({
                success: true,
                messageEn: 'Register successfully!',
                message: 'Đăng ký thành công!',
                _user,
            })
        }

        // create user
        const user = new User({
            email,
            password: hashPassword.encrypt(password),
            roles: dbRoles.map((role) => role._id),
            isAdmin: isAdmin === true ? true : false,
        })

        const newUser = await user.save()

        //update key users in Role collection
        dbRoles.forEach((role) => {
            role.users = [...role.users, newUser._id]
            role.save((error) => {
                if (error)
                    return res.status(500).json({
                        success: false,
                        messageEn: 'Internal server error!',
                        message: 'Lỗi server!',
                        error,
                    })
            })
        })

        // email verify token
        sendMailVerify(req, email, newUser._id)

        res.status(201).json({
            success: true,
            messageEn: 'Register successfully!',
            message: 'Đăng ký thành công!',
            newUser,
        })
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
 * @GET /api/auth/confirm
 * @desc
 */
router.get('/confirm/:token', emailVerifyToken, async (req, res) => {
    try {
        const { userId } = req.payload

        const user = await User.findById(userId)

        if (!user)
            return res.status(404).json({
                success: false,
                messageEn: 'User not found!',
                message: 'Tài khoản không tồn tại!',
            })

        if (user.isVerified) {
            return res.status(200).json({
                success: true,
                messageEn: 'User is email verified.',
                message: 'Tài khoản đã được xác thực!',
            })
        }
        user.isVerified = user.isActived = true

        await user.save()
        res.status(200).json({
            success: true,
            messageEn: 'Verified email successfully!',
            message: 'Xác thực email thành công!',
        })
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
 * @GET /api/auth/reset/:id
 * @desc Send email reset password
 */
router.get('/reset/:id', async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id))
            return res.status(400).json({
                succes: false,
                messageEn: 'User not exists!',
                message: 'Tài khoản không tồn tại!',
            })

        const user = await User.findById(req.params.id)
        if (!user)
            return res.status(404).json({
                success: false,
                messageEn: 'User not found!',
                message: 'Tài khoản không tồn tại!',
            })

        // send mail reset
        sendMailReset(req, user.email, user._id)
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
 * @POST /api/auth/reset/:token
 * @desc verify reset password
 */
router.post('/reset/:token', resetVerifyToken, async (req, res) => {
    try {
        const { userId } = req.payload

        const user = await User.findById(userId)

        if (!user)
            return res.status(404).json({
                success: false,
                messageEn: 'User not found!',
                message: 'Tài khoản không tồn tại!',
            })

        res.status(200).json({
            success: true,
            messageEn: 'Verify successfully!',
            message: 'Xác thực thành công!',
        })
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
 * @GET /api/auth
 * @desc Get info user by token
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const { userId } = req.payload
        const user = await User.findById(userId).select('-password').populate({
            path: 'roles',
            select: 'code -_id',
        })

        if (!user) {
            return res.status(404).json({
                success: false,
                messageEn: 'User not found!',
                message: 'Tài khoản không tồn tại!',
            })
        }

        res.status(200).json({
            success: true,
            messageEn: 'Authenticated!',
            message: 'Đăng nhập thành công!',
            user,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Lỗi server!',
            error,
        })
    }
})
module.exports = router
