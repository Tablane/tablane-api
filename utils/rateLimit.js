const { RateLimiterMemory } = require('rate-limiter-flexible')
const AppError = require('../HttpError')
const { wrapAsync } = require('../middleware')

const rateLimiter = new RateLimiterMemory({
    points: 1000,
    duration: 60
})

module.exports.rateLimit = wrapAsync(async (req, res, next) => {
    const key = req.ip

    if (req.path.startsWith('/api/user/')) {
        console.log('doing something special with user')
        await rateLimiter
            .consume(key, 50)
            .then(() => {
                next()
            })
            .catch(() => {
                throw new AppError('Too Many Requests', 429, {
                    friendlyError: true
                })
            })
    } else {
        await rateLimiter
            .consume(key, 1)
            .then(() => {
                next()
            })
            .catch(() => {
                throw new AppError('Too Many Requests', 429, {
                    friendlyError: true
                })
            })
    }
})
