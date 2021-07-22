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
                            value: mongoose.Types.ObjectId
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
            _id: mongoose.Types.ObjectId,
            name: String,
            labels: {
                _id: mongoose.Types.ObjectId,
                name: String,
                color: String,
            }
        }
    ]
})

module.exports = mongoose.model('Board', boardSchema)
