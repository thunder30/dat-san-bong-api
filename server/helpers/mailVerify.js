const mailer = require('./mailer')
const generateToken = require('../utils/generateToken')

const sendMailVerify = (req, email, userId) => {
    // send mail verify token
    const token = generateToken({ userId }, { expiresIn: '5m' })
    const url = `http://${req.headers.host}/api/auth/confirm/${token}`
    console.log(`url email verify: `, url)

    // send mail
    mailer.sendMail(email, url)
}

const sendMailReset = (req, email, userId) => {
    // send mail verify token
    const token = generateToken({ userId }, { expiresIn: '5m' })
    const url = `http://${req.headers.host}/api/auth/reset/${token}`
    console.log(`url reset pw: `, url)

    // send mail
    mailer.sendMail(email, url)
}

module.exports = { sendMailVerify, sendMailReset }
