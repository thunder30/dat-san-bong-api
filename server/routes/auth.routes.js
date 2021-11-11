const express = require('express')
const router = express.Router()
const { validationResult } = require('express-validator')
const hashPassword = require('../utils/hashPassword')
const User = require('../models/User')
const Role = require('../models/Role')
const {
    validateRegister,
    validateLogin,
    validateResult,
} = require('../middlewares/validate.middleware')
const generateToken = require('../utils/generateToken')
const {
    verifyToken,
    emailVerifyToken,
} = require('../middlewares/auth.middleware')
const mailer = require('../helpers/mailer')

/**
 * @POST /api/auth/login
 * @desc
 */
router.post('/login', validateLogin, async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await User.findOne({ email }).populate('roles')

        if (!user)
            return res.status(400).json({
                success: false,
                message: 'Wrong email or password!',
            })

        const originalPassword = hashPassword.decrypt(user.password)
        if (password !== originalPassword)
            return res.status(400).json({
                success: false,
                message: 'Wrong email or password!',
            })

        // check email verify
        if (!user.isVerify) {
            const token = generateToken(
                { userId: user._id },
                { expiresIn: '5m' }
            )
            const url = `http://${req.headers.host}/api/auth/confirm/${token}`
            // send mail
            mailer.sendMail(email, url)
            return res.status(401).json({
                success: false,
                message: 'User is not email verify. Please check my email.',
            })
        }

        if (!user.isActive)
            return res.status(403).json({
                success: false,
                message: 'The user is deactivated!',
            })

        // get codes in roles
        const roles = user.roles.map((role) => role.code)

        // generation access token
        const accessToken = generateToken(
            { userId: user._id, roles, isAdmin: user.isAdmin },
            { expiresIn: '1h' }
        )

        // write log for login
        user.lastLogin = Date.now()
        user.accessToken = accessToken
        await user.save()

        res.status(200).json({
            success: true,
            message: 'Login successfully!',
            accessToken,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error.',
            error,
        })
    }
})

/**
 * @POST /api/auth/register
 * @desc
 */
router.post('/register', validateRegister, validateResult, async (req, res) => {
    // start create User
    const { email, password, roles, isAdmin } = req.body
    try {
        // get roles
        const dbRoles = await Role.find({ code: { $in: roles } })

        if (dbRoles.length !== roles.length)
            return res.status(400).json({
                success: false,
                message: `A role doesn't exists at least`,
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
                    message: 'User already exists!',
                })

            // update user
            _user.roles = [..._user.roles, ...newRoles]

            await _user.save()
            return res.status(200).json({
                success: true,
                message: 'Register successfully!',
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
                        message: 'Internal server error!',
                        error,
                    })
            })
        })

        // send mail verify token
        const token = generateToken(
            { userId: newUser._id },
            { expiresIn: '5m' }
        )
        const url = `http://${req.headers.host}/api/auth/confirm/${token}`
        console.log(`url: `, url)

        // send mail
        mailer.sendMail(email, url)

        res.status(201).json({
            success: true,
            message: 'Register successfully!',
            newUser,
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
 * @GET /api/auth/confirm
 * @desc
 */
router.get('/confirm/:token', emailVerifyToken, async (req, res) => {
    try {
        const userId = req.userId

        const user = await User.findById(userId)

        if (user.isVerify) {
            return res.status(400).json({
                message: 'User is email verified.',
            })
        }
        user.isVerify = user.isActive = true

        await user.save()
        res.status(200).json({
            success: true,
            message: 'Verified email successfully!',
        })
    } catch (error) {
        res.status(403).json({ message: 'Access token is not valid!', error })
    }
})

module.exports = router
