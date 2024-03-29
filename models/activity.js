const { Schema, model } = require('mongoose')

const activitySchema = new Schema({
    type: { type: String, enum: ['activity'] },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    change: Object,
    timestamp: String,
    referencedUser: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    task: {
        type: Schema.Types.ObjectId,
        ref: 'Task'
    }
})

module.exports = model('Activity', activitySchema)
