const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        fisrtName: { type: String, default: '' },
        lastName: { type: String, default: '' },
        sex: { type: String, enum: ['Nam', 'Nữ', 'Khác'], default: 'Khác' },
        phone: { type: String, default: '' },
        birthday: { type: Date, default: null },
        avatar: { type: String, default: '' },
        address: { type: String, default: '' },
        ward: { type: String, default: '' },
        district: { type: String, default: '' },
        province: { type: String, default: '' },
        lastLogin: { type: Date, default: null },
        lastLogout: { type: Date, default: null },
        isActive: { type: Boolean, default: false },
        isVerify: { type: Boolean, default: false },
        isAdmin: { type: Boolean, default: false },
        roles: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Role',
            },
        ],
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model('User', UserSchema)
