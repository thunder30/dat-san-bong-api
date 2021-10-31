const CryptoJS = require('crypto-js')

const encrypt = (plainText) => {
    return CryptoJS.AES.encrypt(plainText, process.env.SECRET_KEY).toString()
}

const decrypt = (cipherText) => {
    const bytes = CryptoJS.AES.decrypt(cipherText, process.env.SECRET_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
}

module.exports = { encrypt, decrypt }
