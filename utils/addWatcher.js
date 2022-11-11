module.exports.addWatcher = (task, user) => {
    if (task.watcher.indexOf(user._id) === -1) {
        task.watcher.push(user)
    }
}
