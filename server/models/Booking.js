const mongoose = require('mongoose')
const Schema = mongoose.Schema

const BookingSchema = new Schema(
    {
        startDate: { type: String, required: true },
        endDate: { type: String, required: true },
        total: { type: Number, required: true },
        isPaid: { type: Boolean, default: false },
        customer:
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
)
module.exports = mongoose.model('Booking', BookingSchema)