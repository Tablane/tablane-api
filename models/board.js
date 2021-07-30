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
                            column: mongoose.Types.ObjectId,
                            value: String,
                        }
                    ]
                }
            ]
        }
    ],
    members: [String],
    attributes: [
        {
            type: { type: String },
            _id: mongoose.Types.ObjectId,
            name: String,
            labels: [
                {
                    _id: mongoose.Types.ObjectId,
                    name: String,
                    color: String,
                }
            ]
        }
    ]
})

module.exports = mongoose.model('Board', boardSchema)
