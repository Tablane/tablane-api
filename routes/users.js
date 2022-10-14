const passport = require('passport')
const User = require('./../models/user')
const RefreshToken = require('./../models/refreshToken')
const router = require('express').Router()
const bcrypt = require('bcrypt')
const { wrapAsync, isLoggedIn } = require('../middleware')
const { verify } = require('jsonwebtoken')
const AppError = require('../HttpError')
const {
    createAccessToken,
    createRefreshToken,
    sendRefreshToken,
    createRefreshTokenDoc
} = require('../utils/auth')

router.get(
    '/logout',
    wrapAsync(async (req, res) => {
        const sessionId = req.session.id
        const io = req.app.get('socketio')

        req.session.destroy(() => {
            io.to(sessionId).disconnectSockets()
            res.status(204).end()
        })

        req.logout()
        res.json({ success: true, message: 'OK' })
    })
)

router.post(
    '/register',
    wrapAsync(async (req, res) => {
        const { username, email, password } = req.body
        const user = await User.findOne({ email })
        if (user) throw new AppError('User already exists', 400)

        const hash = await bcrypt.hashSync(password, 12)

        const newUser = new User({
            username,
            password: hash,
            workspaces: [],
            email
        })

        await newUser.save()

        res.json({
            success: true,
            message: 'user created'
        })
    })
)

router.post(
    '/login',
    wrapAsync(async (req, res) => {
        const { email, password } = req.body
        let user = await User.findOne({ email }).populate('refreshTokens')
        if (!user) throw new AppError('User does not exist', 400)

        const valid = await bcrypt.compareSync(password, user.password)
        if (!valid) throw new AppError('Invalid password', 400)

        // remove expired refreshTokens
        const expiredTokens = user.refreshTokens
            .filter(x => x.expiresAt < Date.now())
            .map(x => x._id)
        await RefreshToken.deleteMany({
            _id: { $in: expiredTokens }
        })
        user.refreshTokens = user.refreshTokens.filter(x => {
            return !expiredTokens.includes(x._id)
        })

        const token = await createRefreshToken(user)
        const refreshToken = createRefreshTokenDoc(req, token, user)
        user.refreshTokens.push(refreshToken)
        sendRefreshToken(res, token)

        await refreshToken.save()
        await user.save()
        res.json({
            success: true,
            user: {
                accessToken: createAccessToken(user)
            }
        })
    })
)

router.get(
    '/refresh',
    wrapAsync(async (req, res) => {
        const token = req.cookies.refresh_token
        if (!token) throw new AppError('invalid refresh token', 400)

        let payload = null
        try {
            payload = verify(token, process.env.REFRESH_TOKEN_SECRET)
        } catch (err) {
            throw new AppError('invalid refresh token', 400)
        }

        const user = await User.findOne({ email: payload.user.email }).populate(
            'refreshTokens'
        )
        const currentRefreshToken = user.refreshTokens.find(
            x => x.token === token
        )
        if (currentRefreshToken && currentRefreshToken.expiresAt > Date.now()) {
            user.refreshTokens = user.refreshTokens.filter(
                x => x.token !== token
            )
            await RefreshToken.findByIdAndDelete(currentRefreshToken._id)
            const newToken = await createRefreshToken(user)
            const newRefreshToken = createRefreshTokenDoc(req, newToken, user)
            await newRefreshToken.save()
            user.refreshTokens.push(newRefreshToken)
            sendRefreshToken(res, newToken)
            await user.save()
        } else {
            throw new AppError('invalid refresh token', 400)
        }

        res.json({
            success: true,
            accessToken: createAccessToken(user)
        })
    })
)

router.get(
    '/',
    isLoggedIn,
    wrapAsync(async (req, res) => {
        if (!req.user)
            return res.status(200).json({
                success: false,
                error: 'Unauthorized'
            })
        res.json(req.user)
    })
)

module.exports = router
