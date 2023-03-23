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
        match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    },
    unseenNotifications: {
        type: Number,
        default: 0
    },
    blocked: {
        type: Boolean,
        default: false
    },
    mfa_enabled: {
        type: Boolean,
        default: false
    },
    mfa_methods: {
        totp: { enabled: Boolean, secret: String },
        backup_codes: { enabled: Boolean, codes: [Number] },
        email: { enabled: Boolean },
        security_key: {
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
