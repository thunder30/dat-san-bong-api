const { check, validationResult } = require('express-validator')

const validateRegister = (req, res, next) => {
    // check Register
    validateResult(req, res, next)
}

const validateLogin = (req, res, next) => {
    // check Login
    return [check('email',"Email Invalid Format").isEmail()]
    // validateResult(req, res, next)
}

const validateResult = (req, res, next) => {
    // Check validate body
    const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
        // Build your resulting errors however you want! String, object, whatever - it works!
        return `${param}: ${msg}`
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
    next()
}
module.exports = { validateLogin, validateRegister, validateResult }
