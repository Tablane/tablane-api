const Activity = require('../models/activity')

module.exports.addActivity = async (task, user, change) => {
    const activity = new Activity({
        type: 'activity',
        author: user,
        timestamp: new Date().getTime(),
        change
    })
    await activity.save()

    task.history.push(activity)
}
