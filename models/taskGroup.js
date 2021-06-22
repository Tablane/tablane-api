const mongoose = require('mongoose')
const Schema = mongoose.Schema

const taskGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    attributes: [String],
    tasks: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Task'
        }
    ]
})

module.exports = mongoose.model('TaskGroup', taskGroupSchema)
