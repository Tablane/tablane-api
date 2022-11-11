const Activity = require('../models/activity')

module.exports.addActivity = async (task, user, change, referencedUser) => {
    const activity = new Activity({
        type: 'activity',
        author: user,
        timestamp: new Date().getTime(),
        change,
        referencedUser: referencedUser || null
    })
    await activity.save()

    task.history.push(activity)
}
