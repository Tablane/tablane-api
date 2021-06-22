const mongoose = require('mongoose')
const taskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    options: {
        type: Object
    }
})

module.exports = mongoose.model('Task', taskSchema)
