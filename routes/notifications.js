const { isLoggedIn, wrapAsync } = require('../middleware')
const router = require('express').Router()
const Notification = require('../models/notification')
const AppError = require('../HttpError')
const { ObjectId } = require('mongoose').Types

// get notifications
router.post(
    '/:workspaceId',
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        const { condition } = req.body

        const notifications = await Notification.aggregate([
            {
                $match: {
                    workspace: ObjectId(workspaceId),
                    user: req.user._id,
                    ...condition
                }
            },
            {
                $lookup: {
                    from: 'tasks',
                    localField: 'task',
                    foreignField: '_id',
                    as: 'task'
                }
            },
            {
                $unwind: '$task'
            },
            {
                $lookup: {
                    from: 'boards',
                    localField: 'task.board',
                    foreignField: '_id',
                    as: 'task.board'
                }
            },
            {
                $unwind: '$task.board'
            },
            {
                $lookup: {
                    from: 'spaces',
                    localField: 'task.board.space',
                    foreignField: '_id',
                    as: 'task.board.space'
                }
            },
            {
                $unwind: '$task.board.space'
            },
            {
                $sort: {
                    timestamp: -1
                }
            },
            {
                $group: {
                    _id: '$task._id',
                    task: {
                        $first: '$task'
                    },
                    changes: {
                        $push: {
                            timestamp: '$timestamp',
                            user: '$user',
                            change_type: '$change_type',
                            payload: '$payload'
                        }
                    }
                }
            },
            {
                $sort: {
                    'changes.timestamp': -1
                }
            },
            {
                $project: {
                    _id: 0,
                    task: {
                        _id: 1,
                        name: 1,
                        board: {
                            _id: '$task.board._id',
                            name: '$task.board.name',
                            space: {
                                _id: '$task.board.space._id',
                                name: '$task.board.space.name'
                            }
                        }
                    },
                    changes: 1
                }
            }
        ])

        res.json({ notifications })
    })
)

// create notification
router.post(
    '/:workspaceId/:taskId',
    isLoggedIn,
    wrapAsync(async (req, res) => {
        throw new AppError('This route is not available in production', 400)
        const { workspaceId, taskId } = req.params
        const { change_type } = req.body
        const notification = new Notification({
            timestamp: Date.now(),
            user: req.user,
            change_type,
            from: {
                text: 'working on it',
                color: '#00C2E0'
            },
            to: {
                text: 'done',
                color: '#50E898'
            },
            task: taskId,
            workspace: workspaceId,
            cleared: false
        })

        await notification.save()
        res.json({ success: true, message: 'OK' })
    })
)

// clear notification
router.delete(
    '/:workspaceId/:taskId',
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const { workspaceId, taskId } = req.params
        const { condition } = req.body
        const notifications = await Notification.find({
            ...condition,
            workspace: workspaceId,
            task: taskId,
            notificationOwner: req.user._id
        })

        notifications.map(notification => {
            notification.cleared = true
            notification.save()
        })

        res.json({ success: true, message: 'OK' })
    })
)

// unclear notification
router.patch(
    '/:workspaceId/:taskId',
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const { workspaceId, taskId } = req.params
        const { condition } = req.body
        const notifications = await Notification.find({
            ...condition,
            workspace: workspaceId,
            task: taskId,
            notificationOwner: req.user._id
        })

        notifications.map(notification => {
            notification.cleared = false
            notification.save()
        })

        res.json({ success: true, message: 'OK' })
    })
)

module.exports = router
