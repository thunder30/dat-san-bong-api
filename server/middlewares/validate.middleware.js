const { check } = require('express-validator')

const validateRegister = (req, res, next) => {
    // check Register
    next()
}

const validateLogin = (req, res, next) => {
    // check  Login
    next()
}

module.exports = { validateLogin, validateRegister }
