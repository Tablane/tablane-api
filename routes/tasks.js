const router = require('express').Router()
const {wrapAsync, isLoggedIn, hasBoardPerms, hasReadPerms, hasWritePerms} = require("../middleware");
const Task = require('../models/task')
const Board = require('../models/board')

// edit task options
router.patch('/:boardId/:taskGroupId/:taskId', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const {boardId, taskGroupId, taskId} = req.params
    const {column, value, type} = req.body
    const board = await Board.findById(boardId)

    // edit name
    if (type === 'name') {
        board.taskGroups
            .find(x => x._id.toString() === taskGroupId).tasks
            .find(x => x._id.toString() === taskId).name = value
    } else if (type === 'description') {
        board.taskGroups
            .find(x => x._id.toString() === taskGroupId).tasks
            .find(x => x._id.toString() === taskId).description = value
    }

    const options = board.taskGroups
        .find(x => x._id.toString() === taskGroupId).tasks
        .find(x => x._id.toString() === taskId).options
    const option = options.find(x => x.column.toString() === column)

    if (type === 'status') {
        if (option) option.value = value
        else options.push({column, value})
    } else if (type === 'text') {
        if (option) option.value = value
        else options.push({column, value})
    }

    board.save()
    res.send('OK')
}))

// clear status label
router.delete('/:boardId/:taskGroupId/:taskId/:optionId', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const {boardId, taskGroupId, taskId, optionId} = req.params
    const board = await Board.findById(boardId)

    const options = board.taskGroups
        .find(x => x._id.toString() === taskGroupId).tasks
        .find(x => x._id.toString() === taskId).options

    const optionIndex = options.indexOf(options.find(x => x.column.toString() === optionId))
    if (optionIndex >= 0) options.splice(optionIndex, 1)

    board.save()
    res.send('OK')
}))

// drag and drop task sorting
router.patch('/:boardId/', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const {boardId} = req.params
    const {result} = req.body
    const board = await Board.findById(boardId)

    const sourceTaskGroup = board.taskGroups.find(x => x._id.toString() === result.source.droppableId)
    const sourceIndex = sourceTaskGroup.tasks.findIndex(x => x._id.toString() === result.draggableId)
    const destinationTaskGroup = board.taskGroups.find(x => x._id.toString() === result.destination.droppableId)

    const task = sourceTaskGroup.tasks.splice(sourceIndex, 1)
    destinationTaskGroup.tasks.splice(result.destination.index, 0, task[0])

    board.save()
    res.send('OK')
}))

// add new Task
router.post('/:boardId/:taskGroupId', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const { boardId, taskGroupId } = req.params
    const { name, _id } = req.body
    const board = await Board.findById(boardId)

    const task = new Task({_id, name, options: []})
    board.taskGroups.find(x => x._id.toString() === taskGroupId).tasks.push(task)

    await board.save()
    res.send('OK')
}))

// delete a task
router.delete('/:boardId/:taskGroupId/:taskId', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const { boardId, taskGroupId, taskId } = req.params
    const board = await Board.findById(boardId)

    const taskGroup = board.taskGroups.find(x => x._id.toString() === taskGroupId)
    const task = taskGroup.tasks.find(x => x._id.toString() === taskId)
    const taskIndex = taskGroup.tasks.indexOf(task)
    taskGroup.tasks.splice(taskIndex, 1)

    await board.save()
    res.send('OK')
}))

module.exports = router