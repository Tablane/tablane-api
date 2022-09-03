const mongoose = require('mongoose')
const taskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    options: [
        {
            column: mongoose.Types.ObjectId,
            value: mongoose.Types.ObjectId
        }
    ],
    history: []
})

module.exports = mongoose.model('Task', taskSchema)
