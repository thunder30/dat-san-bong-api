const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RoleSchema = new Schema(
    {
        name: { type: String, required: true },
        code: { type: String, unique: true, required: true },
        users: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
    }
)
module.exports = mongoose.model('Role', RoleSchema)
