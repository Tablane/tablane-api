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
                    from: 'users',
                    let: { watchers: '$task.watcher' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ['$_id', '$$watchers'] }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                username: 1
                            }
                        }
                    ],
                    as: 'task.watcher'
                }
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
                $lookup: {
                    from: 'users',
                    localField: 'actor',
                    foreignField: '_id',
                    as: 'actor'
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: 'referencedComment',
                    foreignField: '_id',
                    as: 'referencedComment'
                }
            },
            {
                $unwind: {
                    path: '$referencedComment',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: 'referencedComment.thread',
                    foreignField: '_id',
                    as: 'referencedComment.thread'
                }
            },
            {
                $unwind: {
                    path: '$referencedComment.thread',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    let: { replyIds: '$referencedComment.replies' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $isArray: '$$replyIds' },
                                        { $in: ['$_id', '$$replyIds'] }
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'author',
                                foreignField: '_id',
                                as: 'author'
                            }
                        },
                        {
                            $addFields: {
                                author: { $arrayElemAt: ['$author', 0] }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                content: 1,
                                timestamp: 1,
                                author: {
                                    _id: 1,
                                    username: 1
                                }
                            }
                        }
                    ],
                    as: 'referencedComment.replies'
                }
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
                            actor: {
                                username: {
                                    $arrayElemAt: ['$actor.username', 0]
                                }
                            },
                            referencedComment: '$referencedComment',
                            change_type: '$change_type',
                            field_type: '$field_type',
                            field_name: '$field_name',
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
                        watcher: 1,
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
