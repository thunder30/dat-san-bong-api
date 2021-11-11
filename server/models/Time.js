const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TimeSchema = new Schema(
    {
        code : {type: String, required: true },
        start_Time: {type: String, required: true },
        end_Time: {type: String, required: true },
        description: {type: String, required: false },
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Time', TimeSchema)