const mongoose = require('mongoose')
const Schema = mongoose.Schema

const slug = require('mongoose-slug-generator')

const RoleSchema = new Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, slug: `name`, unique: true },
    },
    {
        timestamps: true,
    }
)

mongoose.plugin(slug)

module.exports = mongoose.model('Role', RoleSchema)
