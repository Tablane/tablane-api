const { Schema, model } = require('mongoose')
const mongoose = require('mongoose')

const commentSchema = new Schema({
    type: { type: String, enum: ['comment', 'reply'] },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    content: Object,
    timestamp: String,
    task: {
        type: Schema.Types.ObjectId,
        ref: 'Task'
    },
    thread: {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    },
    replies: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ]
})

commentSchema.post('findOneAndDelete', async function (comment) {
    if (!comment) return

    comment.replies.map(async reply => {
        await mongoose.model('Comment', commentSchema).findByIdAndDelete(reply)
    })
})

module.exports = model('Comment', commentSchema)
