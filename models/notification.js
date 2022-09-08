const mongoose = require('mongoose')
const Schema = mongoose.Schema
const userSchema = new mongoose.Schema({
    change_type: String,
    timestamp: Number,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    from: {
        text: String,
        color: String
    },
    to: {
        text: String,
        color: String
    },
    task: {
        type: Schema.Types.ObjectId,
        ref: 'Task'
    },
    workspace: {
        type: Schema.Types.ObjectId,
        ref: 'Workspace'
    },
    cleared: Boolean
})

module.exports = mongoose.model('Notification', userSchema)
