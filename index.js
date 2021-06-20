const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const mongoose = require("mongoose")
const passport = require("passport")
const passportLocal = require("passport-local")
const bcrypt = require("bcrypt")
const session = require('express-session')
const app = express()
const User = require('./models/user')

mongoose.connect(`mongodb://localhost:27017/taskBoard`, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}, () => console.log('connected to database'))

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(
    session({
        secret: "secretcode",
        resave: true,
        saveUninitialized: true,
    })
);
app.use(cookieParser("secretcode"));
app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);

app.use(cors({
    origin: ['http://localhost:3000', 'https://web.postman.co'],
    credentials: true
}))

app.post('/login', async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) throw err
        if (!user) res.send('No User Exists')
        else {
            req.logIn(user, err => {
                if (err) throw err
                res.send('logged in')
            })
        }
    })(req, res, next)
})

app.post("/register", (req, res) => {
    User.findOne({username: req.body.username}, async (err, doc) => {
        if (err) throw err;
        if (doc) res.send("User Already Exists");
        if (!doc) {
            bcrypt.hash(req.body.password, 12, async function(err, hash) {
                const newUser = new User({
                    username: req.body.username,
                    password: hash,
                });
                await newUser.save();
                res.send("User Created", err, hash);
            })
        }
    })
})

app.get('/logout', async (req, res) => {
    req.logout()
    res.send('sucessfully logged out')
})

app.get('/user', async (req, res) => {
    res.send(req.user)
})

app.listen(3001, () => {
    console.log('Listening on port 3001')
})