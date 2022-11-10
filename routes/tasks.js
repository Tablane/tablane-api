const router = require('express').Router()
const { wrapAsync, isLoggedIn, hasPermission } = require('../middleware')
const Task = require('../models/task')
const User = require('../models/user')
const Board = require('../models/board')
const Activity = require('../models/activity')

// add new watcher to task
router.post(
    '/watcher/:taskId',
    isLoggedIn,
    hasPermission('MANAGE:TASK'),
    wrapAsync(async (req, res) => {
        const { taskId } = req.params
        const { userId } = req.body
        const task = await Task.findById(taskId)
        const user = await User.findById(userId)

        task.watcher.addToSet(userId)

        const io = req.app.get('socketio')
        io.to(task.board.toString())
            .except(req.user._id.toString())
            .emit(task.board, {
                event: 'addWatcher',
                id: task.board,
                body: { task, user: { username: user.username, _id: user._id } }
            })

        await task.save()
        res.json({ success: true, message: 'OK' })
    })
)

// remove watcher from task
router.delete(
    '/watcher/:taskId',
    isLoggedIn,
    hasPermission('MANAGE:TASK'),
    wrapAsync(async (req, res) => {
        const { taskId } = req.params
        const { userId } = req.body
        const task = await Task.findById(taskId)
        const user = await User.findById(userId)

        task.watcher.remove(userId)

        const io = req.app.get('socketio')
        io.to(task.board.toString())
            .except(req.user._id.toString())
            .emit(task.board, {
                event: 'removeWatcher',
                id: task.board,
                body: { task, user: { username: user.username, _id: user._id } }
            })

        await task.save()
        res.json({ success: true, message: 'OK' })
    })
)

// edit task options
router.patch(
    '/:boardId/:taskId',
    isLoggedIn,
    hasPermission('MANAGE:TASK'),
    wrapAsync(async (req, res) => {
        const { boardId, taskId } = req.params
        const { column, value, type } = req.body
        const task = await Task.findById(taskId)

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
        } else if (type === 'person') {
            if (option) option.value = value
            else options.push({ column, value })
        }

        const io = req.app.get('socketio')
        io.to(boardId).except(req.user._id.toString()).emit(boardId, {
            event: 'editOptionsTask',
            id: boardId,
            body: { column, value, type, taskId }
        })

        await task.save()
        res.json({ success: true, message: 'OK' })
    })
)

// clear status label
router.delete(
    '/:boardId/:taskId/:optionId',
    isLoggedIn,
    hasPermission('MANAGE:TASK'),
    wrapAsync(async (req, res) => {
        const { boardId, taskId, optionId } = req.params
        const task = await Task.findById(taskId)

        const options = task.options
        const optionIndex = options.indexOf(
            options.find(x => x.column.toString() === optionId)
        )
        if (optionIndex >= 0) options.splice(optionIndex, 1)

        const io = req.app.get('socketio')
        io.to(boardId).except(req.user._id.toString()).emit(boardId, {
            event: 'clearStatusTask',
            id: boardId,
            body: { taskId, optionId }
        })

        await task.save()
        res.json({ success: true, message: 'OK' })
    })
)

// add subtask to task
router.post(
    '/:boardId/:taskId',
    isLoggedIn,
    hasPermission('MANAGE:TASK'),
    wrapAsync(async (req, res) => {
        const { boardId, taskId } = req.params
        const { name, taskGroupId, _id } = req.body
        const task = await Task.findById(taskId)

        const subtask = new Task({
            _id,
            name,
            options: [],
            board: task.board,
            description: '',
            watcher: [],
            workspace: task.workspace,
            parentTask: task,
            level: task.level + 1,
            history: [
                // {
                //     type: 'activity',
                //     author: req.user.username,
                //     text: 'created this task',
                //     timestamp: new Date().getTime()
                // }
            ]
        })

        task.subtasks.push(subtask)

        // const io = req.app.get('socketio')
        // io.to(boardId)
        //     .except(req.user._id.toString())
        //     .emit(boardId, {
        //         event: 'addTask',
        //         id: boardId,
        //         body: {
        //             newTaskName: name,
        //             taskGroupId,
        //             _id,
        //             author: req.user.username
        //         }
        //     })

        await task.save()
        await subtask.save()
        res.json({ success: true, message: 'OK' })
    })
)

// drag and drop task sorting
router.patch(
    '/:boardId',
    isLoggedIn,
    hasPermission('MANAGE:TASK'),
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
                board.groupBy === 'none' ||
                !board.groupBy ||
                result.destination.droppableId === 'empty'
            )
        ) {
            task.options.push({
                column: board.groupBy,
                value: result.destination.droppableId
            })
        }

        const [deletedTask] = board.tasks.splice(sourceIndex, 1)

        if (destinationIndex < 0) board.tasks.push(deletedTask)
        else board.tasks.splice(destinationIndex, 0, deletedTask)

        const io = req.app.get('socketio')
        io.to(boardId).except(req.user._id.toString()).emit(boardId, {
            event: 'sortTask',
            id: boardId,
            body: { result, destinationIndex, sourceIndex }
        })

        await task.save()
        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

// add new Task
router.post(
    '/:boardId',
    isLoggedIn,
    hasPermission('CREATE:TASK'),
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const { name, taskGroupId, _id } = req.body
        const board = await Board.findById(boardId).populate([
            'tasks',
            'workspace'
        ])

        const newTaskActivity = new Activity({
            type: 'activity',
            author: req.user,
            timestamp: new Date().getTime(),
            change: {
                type: 'creation'
            }
        })

        const task = new Task({
            _id,
            name,
            options: [],
            board: board,
            description: '',
            watcher: [],
            workspace: board.workspace,
            comments: [],
            history: [newTaskActivity]
        })

        newTaskActivity.task = task

        if (board.groupBy) {
            task.options.push({
                column: board.groupBy,
                value: taskGroupId
            })
        }

        board.tasks.push(task)

        const io = req.app.get('socketio')
        io.to(boardId)
            .except(req.user._id.toString())
            .emit(boardId, {
                event: 'addTask',
                id: boardId,
                body: {
                    newTaskName: name,
                    taskGroupId,
                    _id,
                    author: req.user.username
                }
            })

        await task.save()
        await board.save()
        await newTaskActivity.save()
        res.json({ success: true, message: 'OK' })
    })
)

// delete a task
router.delete(
    '/:boardId/:taskId',
    isLoggedIn,
    hasPermission('DELETE:TASK'),
    wrapAsync(async (req, res) => {
        const { boardId, taskId } = req.params
        const task = await Task.findById(taskId).populate([
            'board',
            'parentTask'
        ])

        if (task.level === 0) {
            const taskIndex = task.board.tasks.indexOf(task)
            task.board.tasks.splice(taskIndex, 1)

            const io = req.app.get('socketio')
            io.to(boardId).except(req.user._id.toString()).emit(boardId, {
                event: 'deleteTask',
                id: boardId,
                body: { taskId }
            })

            await task.board.save()
        } else {
            const taskIndex = task.parentTask.subtasks.indexOf(task)
            task.parentTask.subtasks.splice(taskIndex, 1)

            // const io = req.app.get('socketio')
            // io.to(boardId).except(req.user._id.toString()).emit(boardId, {
            //     event: 'deleteTask',
            //     id: boardId,
            //     body: { taskId }
            // })

            await task.parentTask.save()
        }

        await Task.findByIdAndDelete(taskId)
        res.json({ success: true, message: 'OK' })
    })
)

module.exports = router
