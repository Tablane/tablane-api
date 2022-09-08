const mongoose = require('mongoose')
const { Schema } = require('mongoose')

const taskSchema = new mongoose.Schema({
    name: String,
    options: [
        {
            column: String,
            value: String
        }
    ],
    history: [],
    description: String,
    board: {
        type: Schema.Types.ObjectId,
        ref: 'Board'
    }
})

module.exports = mongoose.model('Task', taskSchema)
