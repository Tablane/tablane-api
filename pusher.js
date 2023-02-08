const Pusher = require('pusher')
const dotenv = require('dotenv')

dotenv.config()
const pusher = new Pusher({
    host: process.env.PUSHER_HOST,
    useTLS: true,
    appId: process.env.PUSHER_APP,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET
})

module.exports = pusher
