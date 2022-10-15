const { sign } = require('jsonwebtoken')
const parser = require('ua-parser-js')
const RefreshToken = require('../models/refreshToken')

exports.createAccessToken = _id => {
    return sign({ user: { _id } }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '10s'
    })
}

exports.createRefreshToken = async _id => {
    return await sign({ user: { _id } }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '30s'
    })
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
