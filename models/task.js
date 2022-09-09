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
    history: [],
    description: String,
    board: {
        type: Schema.Types.ObjectId,
        ref: 'Board'
    },
    watcher: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
})

module.exports = mongoose.model('Task', taskSchema)
