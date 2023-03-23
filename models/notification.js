const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new mongoose.Schema({
    timestamp: Number,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    actor: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    referencedUser: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    referencedComment: {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    },
    change_type: String,
    field_type: String,
    field_name: String,
    payload: Schema.Types.Mixed,
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
