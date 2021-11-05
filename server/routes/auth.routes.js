const express = require('express')
const router = express.Router()
const { validationResult } = require('express-validator')
const hashPassword = require('../utils/hashPassword')
const User = require('../models/User')
const Role = require('../models/Role')
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
    const { email, password, roles } = req.body
    try {
        // get roles
        const dbRoles = await Role.find({ code: { $in: roles } })

        if (dbRoles.length === 0)
            return res.status(400).json({
                success: false,
                message: `A role doesn't exists at least`,
            })

        // create user
        const user = new User({
            email,
            password: hashPassword.encrypt(password),
            roles: dbRoles.map((role) => role._id),
        })

        // add user in Role collection
        const newUser = await user.save()

        // update role
        // dbRoles.forEach(role => {
        //     Role.find({code: role})
        //     role.users.push(newUser._id)
        // })

        res.status(200).json({
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
router.get('/confirm', (req, res) => {
    res.send('Send verify your email')
})

module.exports = router
