const passport = require("passport")
const Users = require('./../models/user')
const router = require('express').Router()
const bcrypt = require('bcrypt')

router.post('/login', async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) throw err
        if (!user) res.send('Username or password is wrong.')
        else {
            req.logIn(user, err => {
                if (err) throw err
                res.send('Successfully logged in')
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
                    password: hash
                });
                await newUser.save();

                passport.authenticate('local', (err, user, info) => {
                    if (err) throw err
                    if (!user) res.send('Username or password is wrong.')
                    else {
                        req.logIn(user, err => {
                            if (err) throw err
                            res.send("Successfully registered", err, hash);
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
    // return res.send('true')
    res.send(req.user)
})

module.exports = router