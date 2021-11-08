const jwt = require('jsonwebtoken')

const generateToken = (payload, options) => {
    const token = jwt.sign(
        {
            ...payload,
        },
        process.env.SECRET_KEY,
        {
            ...options,
        }
    )
    return token
}

module.exports = generateToken
