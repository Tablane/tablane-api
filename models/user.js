const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    workspaces: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Workspace'
        }
    ],
    email: {
        type: String,
        required: true,
        match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    },
    newNotifications: Number,
    assignedTasks: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Task'
        }
    ],
    multiFactorAuth: {
        type: Boolean,
        default: false
    },
    multiFactorMethods: {
        totp: { enabled: Boolean, secret: String },
        backupCodes: { enabled: Boolean, codes: [Number] },
        email: { enabled: Boolean },
        securityKey: {
            devices: [
                {
                    counter: Number,
                    credentialID: Buffer,
                    credentialPublicKey: Buffer
                }
            ]
        }
    },
    refreshTokens: [
        {
            type: Schema.Types.ObjectId,
            ref: 'RefreshToken'
        }
    ]
})

module.exports = mongoose.model('User', userSchema)
