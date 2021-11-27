const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PitchSchema = new Schema(
    {
        displayName : { type: String, required: true },
        description : { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        pitchType: 
            { 
                type: Schema.Types.ObjectId, 
                ref: 'PitchType' 
            }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Pitch', PitchSchema)