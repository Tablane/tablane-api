const mongoose = require('mongoose')
const Schema = mongoose.Schema

const refreshTokenSchema = new mongoose.Schema({
    expiresAt: {
        type: Number
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    token: {
        type: String,
        required: true
    },
    device: {
        type: String,
        required: true,
        default: 'Unknown Device'
    },
    lastActive: {
        type: Number
    }
})

module.exports = mongoose.model('RefreshToken', refreshTokenSchema)
