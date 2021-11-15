const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PitchTypeSchema = new Schema(
    {
    code: { type: String, default: '' },
    displayName : { type: String, required: true },
    description : { type: String, default: '' },
    isActive: { type: Boolean, default: false },
    pitchBranch:
        {
            type: Schema.Types.ObjectId,
            ref: 'PitchBranch',
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('PitchType', PitchTypeSchema)