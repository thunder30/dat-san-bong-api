const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TimeSchema = new Schema(
    {
        code : {type: String, required: true, unique: true},
        startTime: {type: String, required: true },
        endTime: {type: String, required: true },
        description: {type: String},
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Time', TimeSchema)