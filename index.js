const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bodyParser = require("express");
const app = express()

app.use(cors())
app.use(cookieParser())
app.use(bodyParser.json())

app.post('/login', (req, res) => {
    const {username, password} = req.body
    if (username === '12' && password === '3') {
        res.send({
            token: username + password
        })
    } else {res.status(403).send('Wrong password or username')}
})

app.listen(3001, () => {
    console.log('Listening on port 3001')
})