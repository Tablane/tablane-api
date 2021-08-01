const mongoose = require('mongoose')
const Schema = mongoose.Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    workspaces: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Workspace'
        }
    ]
})

module.exports = mongoose.model('User', userSchema)
