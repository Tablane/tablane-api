const router = require('express').Router()
const {wrapAsync, isLoggedIn, hasBoardPerms, hasReadPerms, hasWritePerms} = require("../middleware");
const Task = require('../models/task')
const Board = require('../models/board')

// edit task options
router.patch('/:boardId/:taskId', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const {boardId, taskGroupId, taskId} = req.params
    const {column, value, type} = req.body
    const board = await Board.findById(boardId)

    // edit name
    if (type === 'name') {
        board.tasks
            .find(x => x._id.toString() === taskId).name = value
    } else if (type === 'description') {
        board.tasks
            .find(x => x._id.toString() === taskId).description = value
    }

    const options = board.tasks
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
router.delete('/:boardId/:taskId/:optionId', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const {boardId, taskId, optionId} = req.params
    const board = await Board.findById(boardId)

    const options = board.tasks
        .find(x => x._id.toString() === taskId).options

    const optionIndex = options.indexOf(options.find(x => x.column.toString() === optionId))
    if (optionIndex >= 0) options.splice(optionIndex, 1)

    board.save()
    res.send('OK')
}))

// drag and drop task sorting
router.patch('/:boardId', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const {boardId} = req.params
    const {result} = req.body
    const board = await Board.findById(boardId)

    const task = board.tasks.find(x => x._id.toString() === result.draggableId)
    const column = task.options.find(option => option.column.toString() === board.groupBy)
    if (column) column.value = result.destination.droppableId
    else if (!(board.groupBy === 'none' && board.groupBy)) task.options.push({ column: board.groupBy, value: result.destination.droppableId })

    board.save()
    res.send('OK')
}))

// add new Task
router.post('/:boardId', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const { boardId } = req.params
    const { name, taskGroupId, _id } = req.body
    const board = await Board.findById(boardId)

    const task = new Task({
        _id,
        name,
        options: [],
        history: [
            {
                type: 'activity',
                author: req.user.username,
                text: 'created this task',
                timestamp: new Date().getTime()
            }
        ]
    })

    if (board.groupBy) {
        task.options.push({
            column: '628f8d4991b1fec278646596',
            value: taskGroupId
        })
    }

    board.tasks.push(task)

    await board.save()
    res.send('OK')
}))

// delete a task
router.delete('/:boardId/:taskId', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const { boardId, taskId } = req.params
    const board = await Board.findById(boardId)

    const task = board.tasks.find(x => x._id.toString() === taskId)
    const taskIndex = board.tasks.indexOf(task)
    board.tasks.splice(taskIndex, 1)

    await board.save()
    res.send('OK')
}))

// add new comment to Task
router.post('/:boardId/:taskId', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const { boardId, taskId } = req.params
    const { text } = req.body
    const board = await Board.findById(boardId)

    const comment = {
        type: 'comment',
        author: req.user.username,
        timestamp: new Date().getTime(),
        text
    }

    board.tasks
        .find(task => task._id.toString() === taskId).history
        .push(comment)

    await board.save()
    res.send('OK')
}))

module.exports = router