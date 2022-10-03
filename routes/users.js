const passport = require('passport')
const Users = require('./../models/user')
const router = require('express').Router()
const bcrypt = require('bcrypt')
const { wrapAsync, isLoggedIn } = require('../middleware')

router.post(
    '/login',
    wrapAsync(async (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) throw err
            if (!user)
                res.status(403).send({
                    success: false,
                    message: 'Username or password is wrong'
                })
            else {
                req.logIn(user, err => {
                    if (err) throw err
                    res.json({ success: true, user: req.user })
                })
            }
        })(req, res, next)
    })
)

router.post(
    '/register',
    wrapAsync(async (req, res, next) => {
        const { username, email, password } = req.body
        Users.findOne({ username: username }, async (err, doc) => {
            if (err) throw err
            if (doc)
                res.json({
                    success: false,
                    error: ['User Already Exists.']
                })
            if (!doc) {
                bcrypt.hash(password, 12, async function (err, hash) {
                    const newUser = new Users({
                        username,
                        password: hash,
                        workspaces: [],
                        email
                    })
                    await newUser
                        .save()
                        .then(x => {
                            // login user after register
                            passport.authenticate(
                                'local',
                                (err, user, info) => {
                                    if (err) throw err
                                    if (!user)
                                        res.json({
                                            success: false,
                                            error: [
                                                'Username or password is wrong.'
                                            ]
                                        })
                                    else {
                                        req.logIn(user, err => {
                                            if (err) throw err
                                            res.json({
                                                success: true,
                                                user: req.user
                                            })
                                        })
                                    }
                                }
                            )(req, res, next)
                        })
                        .catch(err => {
                            console.log(err)
                            return res.json({
                                success: false,
                                error: ['Email wrong']
                            })
                        })
                })
            }
        })
    })
)

router.get(
    '/logout',
    wrapAsync(async (req, res) => {
        const sessionId = req.session.id
        const io = req.app.get('socketio')

        req.session.destroy(() => {
            io.to(sessionId).disconnectSockets()
            res.status(204).end()
        })

        req.logout()
        res.json({ success: true, message: 'OK' })
    })
)

router.get(
    '/',
    wrapAsync(async (req, res) => {
        if (!req.user)
            return res.status(200).json({
                success: false,
                error: 'Unauthorized'
            })
        res.json(req.user)
    })
)

module.exports = router
