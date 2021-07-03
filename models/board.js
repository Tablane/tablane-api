const mongoose = require('mongoose')
const Schema = mongoose.Schema

const boardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    taskGroups: [
        {
            name: String,
            tasks: [
                {
                    name: String,
                    options: [
                        {
                            name: String,
                            value: Number
                        }
                    ]
                }
            ]
        }
    ],
    members: [String],
    attributes: [
        {
            type: Object,
            name: String,
            labels: {
                name: String,
                color: String,
            }
        }
    ]
})

module.exports = mongoose.model('Board', boardSchema)
