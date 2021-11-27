const mongoose = require('mongoose')
const Schema = mongoose.Schema

const BookingDetailSchema = new Schema(
    {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        price: { type: Number, required: true },
        status: { 
            type: Schema.Types.ObjectId, 
            ref: 'Status' 
        },
        booking: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
        },
        pitch: {
            type: Schema.Types.ObjectId,
            ref: 'Pitch',
        },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model('BookingDetail', BookingDetailSchema)