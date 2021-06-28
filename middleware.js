module.exports.isLoggedIn = (req, res, next) => {
    if (!req.user) {
        return res.send('no perms')
    }
    next()
}

module.exports.wrapAsync = func => {
    return (req, res, next) => {
        func(req, res, next).catch(e => next(e))
    }
}