const mongoose = require('mongoose')
const Schema = mongoose.Schema

const boardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    taskGroups: [
        {
            type: Schema.Types.ObjectId,
            ref: 'TaskGroup'
        }
    ]
})

module.exports = mongoose.model('Board', boardSchema)
