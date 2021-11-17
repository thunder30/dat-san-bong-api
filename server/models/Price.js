const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PriceSchema = new Schema(
    {
        pitchType:{
            type: Schema.Types.ObjectId,
            ref: 'PitchType',
        },
        time:{
            type: Schema.Types.ObjectId,
            ref: 'Time',
        },
        price:{type: Number, default: 0}
    },
    {
        timestamps: true
    }
)
module.exports = mongoose.model('Price', PriceSchema)
