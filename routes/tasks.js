const router = require('express').Router()
const {wrapAsync, isLoggedIn} = require("../middleware");
const Task = require('../models/task')
const Board = require('../models/board')

// edit options task options
router.patch('/:boardId/:taskGroupId/:taskId', isLoggedIn, async (req, res) => {
    const {boardId, taskGroupId, taskId} = req.params
    const {property, value} = req.body

    const board = await Board.findById(boardId)
    const options = board.taskGroups
        .find(x => x._id.toString() === taskGroupId).tasks
        .find(x => x._id.toString() === taskId).options
    const option = options.find(x => x.name === property)

    if (option) option.value = value
    else options.push({name: property, value})

    board.save()

    res.send('OK')
})

// add new Task
router.post('/:boardId/:taskGroupId', isLoggedIn, async (req, res) => {
    const { boardId, taskGroupId } = req.params
    const board = await Board.findById(boardId)
    const task = new Task({name: req.body.name, options: []})

    board.taskGroups.find(x => x._id.toString() === taskGroupId).tasks.push(task)

    await board.save()
    res.send('OK')
})

router.delete('/:boardId/:taskGroupId/:taskId', isLoggedIn, async (req, res) => {
    const { boardId, taskGroupId, taskId } = req.params
    const board = await Board.findById(boardId)

    const taskGroup = board.taskGroups.find(x => x._id.toString() === taskGroupId)
    const task = taskGroup.tasks.find(x => x._id.toString() === taskId)
    const taskIndex = taskGroup.tasks.indexOf(task)
    taskGroup.tasks.splice(taskIndex, 1)

    await board.save()
    res.send('OK')
})

module.exports = router