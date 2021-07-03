const router = require('express').Router()
const {wrapAsync, isLoggedIn} = require("../middleware");
const Task = require('../models/task')
const Board = require('../models/board')

// edit options task options
router.patch('/:boardId/:taskGroupId/:taskId', isLoggedIn, async (req, res) => {
    const {boardId, taskGroupId, taskId} = req.params
    const {property, value} = req.body

    Board.findById(boardId, function(err, doc) {
        doc.taskGroups.find(x => x._id.toString() === taskGroupId).tasks
            .find(x => x._id.toString() === taskId).options
            .find(x => x.name === property).value = value
        doc.save()
    })
    res.send('OK')
})

// add new Task
router.post('/:boardId/:taskGroupId', isLoggedIn, async (req, res) => {
    const { boardId, taskGroupId } = req.params
    const board = await Board.findById(boardId)
    let rawTask = {name: req.body.name, options: []}
    board.attributes.map(x => rawTask.options.push({name: x.name, value: -1}))
    const task = new Task(rawTask)

    board.taskGroups.find(x => x._id.toString() === taskGroupId).tasks.push(task)

    await task.save()
    await board.save()
    res.send('OK')
})

module.exports = router