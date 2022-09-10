const User = require('./models/user')
const bcrypt = require('bcrypt')
const LocalStrategy = require('passport-local').Strategy

module.exports = function (passport) {
    passport.use(
        new LocalStrategy((username, password, done) => {
            User.findOne({ username: username }, (err, user) => {
                if (err) throw err
                if (!user) return done(null, false)
                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) throw err
                    if (result === true) {
                        return done(null, user)
                    } else {
                        return done(null, false)
                    }
                })
            }).populate({
                path: 'workspaces',
                model: 'Workspace',
                select: ['id', 'name']
            })
        })
    )

    passport.serializeUser((user, cb) => {
        cb(null, user.id)
    })
    passport.deserializeUser((id, cb) => {
        User.findOne({ _id: id }, (err, user) => {
            const userInformation = {
                username: user.username,
                workspaces: user.workspaces,
                _id: user._id,
                assignedTasks: user.assignedTasks
            }
            cb(err, userInformation)
        })
            .populate({
                path: 'workspaces',
                select: ['id', 'name']
            })
            .populate({
                path: 'assignedTasks',
                select: ['name', 'options', 'workspace'],
                populate: {
                    path: 'workspace',
                    select: ['_id']
                }
            })
    })
}
