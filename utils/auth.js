const { sign } = require('jsonwebtoken')
const parser = require('ua-parser-js')
const RefreshToken = require('../models/refreshToken')

exports.createAccessToken = user => {
    return sign(
        { user: { email: user.email } },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: '15s'
        }
    )
}

exports.createRefreshToken = async user => {
    return await sign(
        { user: { email: user.email } },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: '1m'
        }
    )
}

exports.sendRefreshToken = (res, token) => {
    res.cookie('refresh_token', token, {
        httpOnly: true
    })
}

exports.createRefreshTokenDoc = (req, token, user) => {
    const ua = parser(req.headers['user-agent'])

    return new RefreshToken({
        expiresAt: Date.now() + 1000 * 10,
        token,
        user,
        device: `${ua.browser.name} on ${ua.os.name}`,
        lastActive: Date.now()
    })
}
