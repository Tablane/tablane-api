const { Schema, model } = require('mongoose')

const activitySchema = new Schema({
    type: { type: String, enum: ['activity'] },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    change: {
        type: { type: String },
        field: String
    },
    timestamp: String,
    task: {
        type: Schema.Types.ObjectId,
        ref: 'Task'
    }
})

module.exports = model('Activity', activitySchema)
