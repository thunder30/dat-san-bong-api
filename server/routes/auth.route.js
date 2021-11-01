const express = require('express')
const router = express.Router()
const Crytpo = require('crypto-js')
const { validationResult } = require('express-validator')
const hashPassword = require('../utils/hashPassword')
const User = require('../models/User')
const {
    validateRegister,
    validateLogin,
} = require('../middlewares/validate.middleware')

/**
 * @POST /api/auth/login
 * @desc
 */
router.get('/login', (req, res) => {
    res.send('This is login area')
})

/**
 * @POST /api/auth/register
 * @desc
 */
router.post('/register', validateRegister, async (req, res) => {
    // Check validate body
    const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
        // Build your resulting errors however you want! String, object, whatever - it works!
        return `${location}[${param}]: ${msg}`
    }
    const result = validationResult(req).formatWith(errorFormatter)
    if (!result.isEmpty()) {
        // Response will contain something like
        // { errors: [ "body[password]: must be at least 10 chars long" ] }
        return res.status(400).json({
            success: false,
            message: 'Validate error!',
            errors: result.array(),
        })
    }

    // start create User
    const { email, password } = req.body
    try {
        // check email
        checkUser = await User.findOne({ email })
        if (checkUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists!',
            })
        }

        // add user
        const newUser = new User({
            username,
            email,
            password: hashPassword.encrypt(password),
        })

        const user = await newUser.save()
        res.status(200).json({
            success: true,
            user,
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
router.get('/confirm', (req, res) => {
    res.send('Send verify your email')
})

module.exports = router
