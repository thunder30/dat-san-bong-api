const jwt = require('jsonwebtoken')
const User = require('../../models/User')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const { TokenExpiredError } = require('jsonwebtoken')

const catchError = (err, res, email) => {
    let message = 'Unthorized!'
    if (err instanceof TokenExpiredError) {
        if (email) message = 'Email verify was expired!'
        else message = 'Unthorized! Access Token was expired!'
    }

    return res.status(403).json({
        success: false,
        message,
    })
}

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]
    if (!token)
        return res.status(401).json({
            success: false,
            message: 'Access token is not found!',
        })

    jwt.verify(token, process.env.SECRET_KEY, async (err, payload) => {
        if (err) return catchError(err, res)

        // kiểm tra token có khớp với token trong db không?
        // trong trong trường hợp có nhiều token hợp lệ, và mình chỉ nhận token sau cùng
        try {
            // kiểm tra sự hợp lệ của id
            if (!ObjectId.isValid(payload.userId))
                return res.status(401).json({
                    success: false,
                    message: 'Access token is invalid!',
                })

            const user = await User.findById(payload.userId)
            if (token !== user.accessToken)
                return res.status(401).json({
                    success: false,
                    message: 'Access token is invalid!',
                })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error!',
                error,
            })
        }

        // req.userId = payload.userId
        // req.isAdmin = payload.isAdmin
        req.payload = {
            ...payload,
        }
        next()
    })
}

const emailVerifyToken = (req, res, next) => {
    try {
        const token = req.params.token
        console.log('Email verify token - ', token)
        const payload = jwt.verify(token, process.env.SECRET_KEY)
        //req.userId = userId
        req.payload = {
            ...payload,
        }
        next()
    } catch (error) {
        return catchError(error, res, 'email')
    }
}

const resetVerifyToken = (req, res, next) => {
    try {
        const token = req.params.token
        console.log('Reset verify token - ', token)
        const payload = jwt.verify(token, process.env.SECRET_KEY)
        //req.userId = userId
        req.payload = {
            ...payload,
        }
        next()
    } catch (error) {
        return catchError(error, res, 'reset')
    }
}

module.exports = { verifyToken, emailVerifyToken, resetVerifyToken }
