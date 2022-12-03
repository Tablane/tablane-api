const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const Task = require('./task')
const Comment = require('./comment')
const Activity = require('./activity')

const taskSchema = new mongoose.Schema({
    name: String,
    options: [
        {
            column: String,
            value: Schema.Types.Mixed
        }
    ],
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ],
    history: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Activity'
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
    subtasks: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Task'
        }
    ],
    parentTask: {
        type: Schema.Types.ObjectId,
        ref: 'Task'
    },
    level: {
        type: Number,
        default: 0
    },
    watcher: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
})

taskSchema.post('findOneAndDelete', async function (task) {
    if (!task) return

    task.subtasks.map(
        async task =>
            await mongoose.model('Task', taskSchema).findByIdAndDelete(task)
    )
    task.comments.map(async comment => await Comment.findByIdAndDelete(comment))
    task.history.map(
        async activity => await Activity.findByIdAndDelete(activity)
    )
})

module.exports = mongoose.model('Task', taskSchema)
