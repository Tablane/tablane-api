const Notification = require('../models/notification')

exports.notificationTrigger = async ({
    req,
    watcher,
    referencedUser,
    taskId,
    change_type,
    payload,
    workspaceId
}) => {
    watcher.map(user => {
        if (user.toString() === req.user._id.toString()) return

        const notification = new Notification({
            timestamp: Date.now(),
            actor: req.user,
            user,
            referencedUser,
            change_type,
            payload,
            task: taskId,
            workspace: workspaceId,
            cleared: false
        })
        notification.save()
    })
}
