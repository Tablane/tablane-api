const router = require('express').Router()
const { isLoggedIn, hasPermission, wrapAsync } = require('../middleware')
const Task = require('../models/task')
const Comment = require('../models/comment')

// add new comment to Task
router.post(
    '/:taskId',
    isLoggedIn,
    hasPermission('CREATE:COMMENT'),
    wrapAsync(async (req, res) => {
        const { taskId } = req.params
        const { content } = req.body
        const task = await Task.findById(taskId)

        const comment = new Comment({
            type: 'comment',
            author: req.user,
            timestamp: new Date().getTime(),
            content,
            task
        })

        task.history.unshift(comment)

        // const io = req.app.get('socketio')
        // io.to(boardId)
        //     .except(req.user._id.toString())
        //     .emit(boardId, {
        //         event: 'addTaskComment',
        //         id: boardId,
        //         body: { text, author: req.user.username, taskId }
        //     })

        await comment.save()
        await task.save()
        res.json({ success: true, message: 'OK' })
    })
)

// delete comment
router.delete(
    '/:taskId/:commentId',
    isLoggedIn,
    hasPermission('CREATE:COMMENT'),
    wrapAsync(async (req, res) => {
        const { commentId } = req.params
        const comment = await Comment.findByIdAndRemove(commentId).populate(
            'task'
        )

        comment.task.history = comment.task.history.filter(x => {
            return x.toString() !== commentId
        })

        // const io = req.app.get('socketio')
        // io.to(boardId)
        //     .except(req.user._id.toString())
        //     .emit(boardId, {
        //         event: 'addTaskComment',
        //         id: boardId,
        //         body: { text, author: req.user.username, taskId }
        //     })

        await comment.task.save()
        res.json({ success: true, message: 'OK' })
    })
)

// edit comment
router.put(
    '/:taskId/:commentId',
    isLoggedIn,
    hasPermission('CREATE:COMMENT'),
    wrapAsync(async (req, res) => {
        const { commentId } = req.params
        const { content } = req.body
        const comment = await Comment.findById(commentId)

        comment.content = content

        // const io = req.app.get('socketio')
        // io.to(boardId)
        //     .except(req.user._id.toString())
        //     .emit(boardId, {
        //         event: 'addTaskComment',
        //         id: boardId,
        //         body: { text, author: req.user.username, taskId }
        //     })

        await comment.save()
        res.json({ success: true, message: 'OK' })
    })
)

module.exports = router
