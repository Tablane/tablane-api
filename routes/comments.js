const router = require('express').Router()
const { isLoggedIn, hasPermission, wrapAsync } = require('../middleware')
const Task = require('../models/task')
const Comment = require('../models/comment')
const { addWatcher } = require('../utils/addWatcher')

// add new comment to Task
router.post(
    '/:taskId',
    isLoggedIn,
    hasPermission('CREATE:COMMENT'),
    wrapAsync(async (req, res) => {
        const { taskId } = req.params
        const { content } = req.body
        const task = await Task.findById(taskId)

        addWatcher(task, req.user)

        const comment = new Comment({
            type: 'comment',
            author: req.user,
            timestamp: new Date().getTime(),
            content,
            task,
            replies: []
        })

        task.comments.unshift(comment)

        const io = req.app.get('socketio')
        io.to(task.board.toString())
            .except(req.user._id.toString())
            .emit(task.board.toString(), {
                event: 'addTaskComment',
                id: task.board,
                body: { content, author: req.user.username, taskId }
            })

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

        comment.task.comments = comment.task.comments.filter(x => {
            return x.toString() !== commentId
        })

        await Comment.deleteMany({ _id: { $in: comment.replies } })

        const io = req.app.get('socketio')
        io.to(comment.task.board.toString())
            .except(req.user._id.toString())
            .emit(comment.task.board.toString(), {
                event: 'deleteTaskComment',
                id: comment.task.board,
                body: {
                    commentId,
                    taskId: comment.task._id
                }
            })

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
        const comment = await Comment.findById(commentId).populate('task')

        comment.content = content

        const io = req.app.get('socketio')
        io.to(comment.task.board.toString())
            .except(req.user._id.toString())
            .emit(comment.task.board.toString(), {
                event: 'editTaskComment',
                id: comment.task.board,
                body: {
                    commentId,
                    taskId: comment.task._id,
                    content
                }
            })

        await comment.save()
        res.json({ success: true, message: 'OK' })
    })
)

// add new reply to comment
router.post(
    '/reply/:taskId/:commentId',
    isLoggedIn,
    hasPermission('CREATE:COMMENT'),
    wrapAsync(async (req, res) => {
        const { taskId, commentId } = req.params
        const { content } = req.body
        const comment = await Comment.findById(commentId).populate('task')

        addWatcher(comment.task, req.user)

        const reply = new Comment({
            type: 'reply',
            author: req.user,
            timestamp: new Date().getTime(),
            content,
            task: taskId
        })

        comment.replies.push(reply)

        const io = req.app.get('socketio')
        io.to(comment.task.board.toString())
            .except(req.user._id.toString())
            .emit(comment.task.board.toString(), {
                event: 'addReply',
                id: comment.task.board,
                body: {
                    taskId,
                    author: req.user.username,
                    commentId,
                    content
                }
            })

        await comment.save()
        await reply.save()
        await comment.task.save()
        res.json({ success: true, message: 'OK' })
    })
)

// delete reply
router.delete(
    '/reply/:taskId/:commentId/:replyId',
    isLoggedIn,
    hasPermission('CREATE:COMMENT'),
    wrapAsync(async (req, res) => {
        const { commentId, replyId } = req.params
        await Comment.findByIdAndRemove(replyId)
        const comment = await Comment.findById(commentId).populate('task')

        comment.replies = comment.replies.filter(x => x.toString() !== replyId)

        const io = req.app.get('socketio')
        io.to(comment.task.board.toString())
            .except(req.user._id.toString())
            .emit(comment.task.board.toString(), {
                event: 'deleteReply',
                id: comment.task.board,
                body: {
                    taskId: comment.task._id,
                    replyId,
                    commentId
                }
            })

        await comment.save()
        res.json({ success: true, message: 'OK' })
    })
)

// edit reply
router.put(
    '/reply/:taskId/:replyId',
    isLoggedIn,
    hasPermission('CREATE:COMMENT'),
    wrapAsync(async (req, res) => {
        const { replyId } = req.params
        const { content } = req.body
        const reply = await Comment.findById(replyId).populate('task')

        reply.content = content

        const io = req.app.get('socketio')
        io.to(reply.task.board.toString())
            .except(req.user._id.toString())
            .emit(reply.task.board.toString(), {
                event: 'editReply',
                id: reply.task.board,
                body: {
                    taskId: reply.task._id,
                    replyId,
                    content
                }
            })

        await reply.save()
        res.json({ success: true, message: 'OK' })
    })
)

module.exports = router
