const router = require('express').Router()
const {
    wrapAsync,
    isLoggedIn,
    hasBoardPerms,
    hasReadPerms,
    hasWritePerms
} = require('../middleware')
const Task = require('../models/task')
const Board = require('../models/board')

// edit task options
router.patch(
    '/:boardId/:taskId',
    isLoggedIn,
    hasWritePerms,
    wrapAsync(async (req, res) => {
        const { boardId, taskId } = req.params
        const { column, value, type } = req.body
        const board = await Board.findById(boardId).populate('tasks')
        const task = board.tasks.find(x => x._id.toString() === taskId)

        // edit name
        if (type === 'name') {
            task.name = value
        } else if (type === 'description') {
            task.description = value
        }

        const options = task.options
        const option = options.find(x => x.column.toString() === column)

        if (type === 'status') {
            if (option) option.value = value
            else options.push({ column, value })
        } else if (type === 'text') {
            if (option) option.value = value
            else options.push({ column, value })
        }

        await task.save()
        res.send('OK')
    })
)

// clear status label
router.delete(
    '/:boardId/:taskId/:optionId',
    isLoggedIn,
    hasWritePerms,
    wrapAsync(async (req, res) => {
        const { boardId, taskId, optionId } = req.params
        const board = await Board.findById(boardId).populate('tasks')
        const task = board.tasks.find(x => x._id.toString() === taskId)

        const options = task.options
        const optionIndex = options.indexOf(
            options.find(x => x.column.toString() === optionId)
        )
        if (optionIndex >= 0) options.splice(optionIndex, 1)

        await task.save()
        res.send('OK')
    })
)

// drag and drop task sorting
router.patch(
    '/:boardId',
    isLoggedIn,
    hasWritePerms,
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const { result, destinationIndex, sourceIndex } = req.body
        const board = await Board.findById(boardId).populate('tasks')
        const task = board.tasks.find(
            x => x._id.toString() === result.draggableId
        )

        const column = task.options.find(
            option => option.column.toString() === board.groupBy
        )
        if (column) column.value = result.destination.droppableId
        else if (
            !(
                board.groupBy === 'none' &&
                board.groupBy &&
                result.destination.droppableId === 'empty'
            )
        ) {
            task.options.push({
                column: board.groupBy,
                value: result.destination.droppableId
            })
        }

        board.tasks.splice(sourceIndex, 1)

        if (destinationIndex < 0) board.tasks.push(task)
        else board.tasks.splice(destinationIndex, 0, task)

        await task.save()
        await board.save()
        res.send('OK')
    })
)

// add new Task
router.post(
    '/:boardId',
    isLoggedIn,
    hasWritePerms,
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const { name, taskGroupId, _id } = req.body
        const board = await Board.findById(boardId).populate('tasks')

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
                column: board.groupBy,
                value: taskGroupId
            })
        }

        board.tasks.push(task)

        await task.save()
        await board.save()
        res.send('OK')
    })
)

// delete a task
router.delete(
    '/:boardId/:taskId',
    isLoggedIn,
    hasWritePerms,
    wrapAsync(async (req, res) => {
        const { boardId, taskId } = req.params
        const board = await Board.findById(boardId).populate('tasks')

        const task = board.tasks.find(x => x._id.toString() === taskId)
        const taskIndex = board.tasks.indexOf(task)
        board.tasks.splice(taskIndex, 1)

        await board.save()
        await Task.findByIdAndDelete(taskId)
        res.send('OK')
    })
)

// add new comment to Task
router.post(
    '/:boardId/:taskId',
    isLoggedIn,
    hasWritePerms,
    wrapAsync(async (req, res) => {
        const { boardId, taskId } = req.params
        const { text } = req.body
        const board = await Board.findById(boardId).populate('tasks')
        const task = board.tasks.find(task => task._id.toString() === taskId)

        const comment = {
            type: 'comment',
            author: req.user.username,
            timestamp: new Date().getTime(),
            text
        }

        task.history.push(comment)

        await task.save()
        await board.save()
        res.send('OK')
    })
)

module.exports = router
