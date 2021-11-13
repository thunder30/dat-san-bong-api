const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PitchBranchesSchema = new Schema(
    {
    code: { type: String, default: ''},
    displayName: { type: String, required: true },
    avatar: { type: String, default: '' },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    ward: { type: String, required: true  },
    district: { type: String, required: true },
    province: { type: String, required: true },
    description : { type: String, default: '' },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isActived: { type: Boolean, default: false },
    owner:
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model('PitchBranch', PitchBranchesSchema)