const passport = require("passport")
const Users = require('./../models/user')
const router = require('express').Router()
const bcrypt = require('bcrypt')
const Workspaces = require('../models/workspace')
const {wrapAsync, isLoggedIn} = require("../middleware");

router.post('/login', async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) throw err
        if (!user) res.send('Username or password is wrong.')
        else {
            req.logIn(user, err => {
                if (err) throw err
                res.json({ status: true, msg: ['Successfully logged in', req.user] })
            })
        }
    })(req, res, next)
})

router.post("/register", async (req, res, next) => {
    Users.findOne({username: req.body.username}, async (err, doc) => {
        if (err) throw err;
        if (doc) res.send("User Already Exists");
        if (!doc) {
            bcrypt.hash(req.body.password, 12, async function(err, hash) {

                const newUser = new Users({
                    username: req.body.username,
                    password: hash,
                    workspaces: []
                });
                await newUser.save();

                // login user after register
                passport.authenticate('local', (err, user, info) => {
                    if (err) throw err
                    if (!user) res.send('Username or password is wrong.')
                    else {
                        req.logIn(user, err => {
                            if (err) throw err
                            res.json({ status: true, msg: 'Successfully registered'})
                        })
                    }
                })(req, res, next)

            })
        }
    })
})

router.get('/logout', async (req, res) => {
    req.logout()
    res.send('Successfully logged out')
})

router.get('/user', async (req, res) => {
    // if (!req.user) res.status(401).send('false')
    res.send(req.user)
})

module.exports = router