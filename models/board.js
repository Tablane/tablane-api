const mongoose = require('mongoose')
const User = require('./user')
const Task = require('./task')
const Schema = mongoose.Schema

const boardSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    workspace: {
        type: Schema.Types.ObjectId,
        ref: 'Workspace'
    },
    sharing: {
        type: Boolean
    },
    tasks: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Task'
        }
    ],
    groupBy: String,
    attributes: [
        {
            type: { type: String },
            _id: mongoose.Types.ObjectId,
            name: String,
            labels: [
                {
                    _id: mongoose.Types.ObjectId,
                    name: String,
                    color: String
                }
            ]
        }
    ]
})

boardSchema.post('findOneAndDelete', async function (board) {
    if (!board) return

    board.tasks.map(async task => await Task.findByIdAndDelete(task))
})

module.exports = mongoose.model('Board', boardSchema)
