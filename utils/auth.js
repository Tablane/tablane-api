const { sign } = require('jsonwebtoken')
const parser = require('ua-parser-js')
const RefreshToken = require('../models/refreshToken')

exports.createAccessToken = (_id, sudoMode = false) => {
    return sign({ user: { _id, sudoMode } }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m'
    })
}

exports.createRefreshToken = async _id => {
    return await sign({ user: { _id } }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '24h'
    })
}

exports.sendRefreshToken = (res, token) => {
    res.cookie('refresh_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        path: '/api/user/refresh'
    })
}

exports.createRefreshTokenDoc = (req, token, user) => {
    const ua = parser(req.headers['user-agent'])

    return new RefreshToken({
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
        token,
        user,
        device: `${ua.browser.name} on ${ua.os.name}`,
        lastActive: Date.now()
    })
}
