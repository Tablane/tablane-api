const { isLoggedIn, wrapAsync } = require('../middleware')
const router = require('express').Router()
const Notification = require('../models/notification')
const AppError = require('../HttpError')

// get notifications
router.post(
    '/:workspaceId',
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        const { condition } = req.body
        const notifications = await Notification.find({
            workspace: workspaceId,
            user: req.user._id,
            ...condition
        })
            .sort({ $natural: -1 })
            .populate({
                path: 'user',
                select: 'username'
            })
            .populate({
                path: 'task',
                select: ['name', 'board'],
                populate: {
                    path: 'board',
                    select: ['name'],
                    populate: {
                        path: 'space',
                        select: ['name']
                    }
                }
            })

        res.json(notifications)
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
