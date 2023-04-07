const Notification = require('../models/notification')
const User = require('../models/user')
const pusher = require('../pusher')

exports.notificationTrigger = async ({
    req,
    watcher,
    referencedUser,
    taskId,
    change_type,
    field_type,
    field_name,
    referencedComment = null,
    payload,
    workspaceId
}) => {
    watcher.map(async user => {
        if (user.toString() === req.user._id.toString()) return

        const notification = new Notification({
            timestamp: Date.now(),
            actor: req.user,
            user,
            referencedUser,
            referencedComment,
            change_type,
            field_type,
            field_name,
            payload,
            task: taskId,
            workspace: workspaceId,
            cleared: false
        })
        await notification.save()

        const userDoc = await User.findById(user)

        const workspaceUnseenNotification = userDoc.unseenNotifications.find(
            x => x.workspaceId === workspaceId
        )
        if (workspaceUnseenNotification) {
            workspaceUnseenNotification.unseenCount =
                workspaceUnseenNotification.unseenCount + 1
        } else {
            userDoc.unseenNotifications.push({
                workspaceId: parseInt(workspaceId),
                unseenCount: 1
            })
        }

        userDoc.save()

        pusher.trigger(
            'private-user-' + user.toString(),
            'notification-update-' + workspaceId,
            'add-one'
        )
    })
}
