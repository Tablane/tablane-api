const mongoose = require('mongoose')
const taskSchema = new mongoose.Schema({
    name: String,
    options: [
        {
            column: String,
            value: String
        }
    ],
    history: [],
    description: String
})

module.exports = mongoose.model('Task', taskSchema)
