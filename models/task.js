const mongoose = require('mongoose')
const { Schema } = require('mongoose')

const taskSchema = new mongoose.Schema({
    name: String,
    options: [
        {
            column: String,
            value: Schema.Types.Mixed
        }
    ],
    history: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ],
    description: Buffer,
    board: {
        type: Schema.Types.ObjectId,
        ref: 'Board'
    },
    workspace: {
        type: Schema.Types.ObjectId,
        ref: 'Workspace'
    },
    watcher: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
})

module.exports = mongoose.model('Task', taskSchema)
