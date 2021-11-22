const mongoose = require('mongoose')
const Schema = mongoose.Schema

const StatusSchema = new Schema(
    {
        status: { type: String, required: true },
        description: { type: String, required: true },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model('Status', StatusSchema)