const mongoose = require('mongoose')
const Schema = mongoose.Schema
const userSchema = new mongoose.Schema({
    task: {
        type: Schema.Types.ObjectId,
        ref: 'Task'
    },
    location: {
        space: String,
        board: String
    },
    changes: [],
    mention: Boolean,
    cleared: Boolean,
    workspaceId: Number
})

module.exports = mongoose.model('Notification', userSchema)
