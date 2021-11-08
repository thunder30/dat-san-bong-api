const jwt = require('jsonwebtoken')

const { TokenExpiredError } = require('jsonwebtoken')

const catchError = (err, res, email) => {
    let message = 'Unthorized!'
    if (err instanceof TokenExpiredError) {
        if (email) message = 'Email verify was expired!'
        else message = 'Unthorized! Access Token was expired!'
    }

    return res.status(401).json({
        success: false,
        message,
    })
}

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]
    if (!token)
        return res.status(401).json({
            message: 'Access token is not found!',
        })

    jwt.verify(token, process.env.SECRET_KEY, (err, payload) => {
        if (err) return catchError(err, res)
        req.userId = payload.userId
        next()
    })
}

const emailVerifyToken = (req, res, next) => {
    try {
        const token = req.params.token
        console.log('Email verify token - ', token)
        const { userId } = jwt.verify(token, process.env.SECRET_KEY)
        req.userId = userId
        next()
    } catch (error) {
        return catchError(error, res, 'email')
    }
}

module.exports = { verifyToken, emailVerifyToken }
