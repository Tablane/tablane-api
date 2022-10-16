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
const { authenticator } = require('otplib')
const axios = require('axios')
const jwt = require('jsonwebtoken')

router.get(
    '/logout',
    wrapAsync(async (req, res) => {
        const sessionId = req.session.id
        const io = req.app.get('socketio')

        // req.session.destroy(() => {
        //     io.to(sessionId).disconnectSockets()
        //     res.status(204).end()
        // })
        //
        // req.logout()

        res.clearCookie('refresh_token')
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

router.get(
    '/workspaces',
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const user = await User.findById(req.user._id).populate('workspaces')
        res.json({
            success: true,
            workspaces: user.workspaces
        })
    })
)

router.get(
    '/oauth/google',
    wrapAsync(async (req, res) => {
        const { code } = req.query

        const { data } = await axios({
            url: 'https://oauth2.googleapis.com/token',
            method: 'POST',
            data: {
                code,
                client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
                client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
                grant_type: 'authorization_code'
            }
        })

        const { email, name, email_verified } = jwt.decode(data.id_token)

        if (!email_verified)
            return res.redirect(
                `${process.env.FRONTEND_HOST}/error?error=Email not verified`
            )

        const user = await User.findOne({ email })

        if (user) {
            const token = await createRefreshToken(user._id)
            const refreshToken = createRefreshTokenDoc(req, token, user)
            user.refreshTokens.push(refreshToken)
            sendRefreshToken(res, token)

            await refreshToken.save()
            await user.save()
        } else {
            const newUser = new User({
                username: name,
                workspaces: [],
                password: null,
                email
            })

            await newUser.save()

            const token = await createRefreshToken(newUser._id)
            const refreshToken = createRefreshTokenDoc(req, token, newUser)
            newUser.refreshTokens.push(refreshToken)
            sendRefreshToken(res, token)

            await refreshToken.save()
            await newUser.save()
        }

        res.redirect(process.env.FRONTEND_HOST)
    })
)

router.post(
    '/login',
    wrapAsync(async (req, res) => {
        const { email, password, totp } = req.body
        let user = await User.findOne({ email })
            .populate('refreshTokens')
            .populate({
                path: 'workspaces',
                select: ['id', 'name']
            })
            .populate({
                path: 'assignedTasks',
                select: ['name', 'options', 'workspace', 'board'],
                populate: [
                    {
                        path: 'workspace',
                        select: ['_id']
                    },
                    {
                        path: 'board',
                        select: ['space', 'name'],
                        populate: {
                            path: 'space',
                            select: 'name'
                        }
                    }
                ]
            })
        if (!user) throw new AppError('User does not exist', 400)

        if (!password)
            return res.json({
                success: false,
                nextStep: 'password'
            })

        if (!user.password) throw new AppError('Invalid password', 400)
        const valid = await bcrypt.compareSync(password, user.password)
        if (!valid) throw new AppError('Invalid password', 400)

        if (user.multiFactorAuth) {
            const totpMethod = user.multiFactorMethods.find(
                x => x.type === 'totp'
            )
            if (totp && totpMethod) {
                try {
                    const valid = authenticator.check(totp, totpMethod.secret)
                    if (!valid) {
                        if (totpMethod.backup_codes.includes(totp)) {
                            totpMethod.backup_codes =
                                totpMethod.backup_codes.filter(
                                    x => x.toString() !== totp
                                )
                        } else throw Error()
                    }
                } catch (err) {
                    throw new AppError(
                        'Invalid Multi Factor Authentication',
                        400
                    )
                }
            } else {
                return res.json({
                    success: false,
                    nextStep: 'mfa',
                    methods: ['totp', 'webauthn', 'email']
                })
            }
        }

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

        const token = await createRefreshToken(user._id)
        const refreshToken = createRefreshTokenDoc(req, token, user)
        user.refreshTokens.push(refreshToken)
        sendRefreshToken(res, token)

        await refreshToken.save()
        await user.save()
        res.json({
            success: true,
            accessToken: createAccessToken(user._id),
            user: {
                username: user.username,
                workspaces: user.workspaces,
                _id: user._id,
                assignedTasks: user.assignedTasks,
                newNotifications: user.newNotifications
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

        const user = await User.findById(payload.user._id)
            .populate('refreshTokens')
            .populate({
                path: 'workspaces',
                select: ['id', 'name']
            })
            .populate({
                path: 'assignedTasks',
                select: ['name', 'options', 'workspace', 'board'],
                populate: [
                    {
                        path: 'workspace',
                        select: ['_id']
                    },
                    {
                        path: 'board',
                        select: ['space', 'name'],
                        populate: {
                            path: 'space',
                            select: 'name'
                        }
                    }
                ]
            })
        const currentRefreshToken = user.refreshTokens.find(
            x => x.token === token
        )
        if (currentRefreshToken && currentRefreshToken.expiresAt > Date.now()) {
            user.refreshTokens = user.refreshTokens.filter(
                x => x.token !== token
            )
            await RefreshToken.findByIdAndDelete(currentRefreshToken._id)
            const newToken = await createRefreshToken(user._id)
            const newRefreshToken = createRefreshTokenDoc(req, newToken, user)
            await newRefreshToken.save()
            user.refreshTokens.push(newRefreshToken)
            sendRefreshToken(res, newToken)
            await user.save()
        } else {
            res.clearCookie('refresh_token')
            throw new AppError('invalid refresh token', 400)
        }

        res.json({
            success: true,
            accessToken: createAccessToken(user._id),
            username: user.username,
            workspaces: user.workspaces,
            _id: user._id,
            assignedTasks: user.assignedTasks,
            newNotifications: user.newNotifications
        })
    })
)

router.get(
    '/',
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'workspaces',
                select: ['id', 'name']
            })
            .populate({
                path: 'assignedTasks',
                select: ['name', 'options', 'workspace', 'board'],
                populate: [
                    {
                        path: 'workspace',
                        select: ['_id']
                    },
                    {
                        path: 'board',
                        select: ['space', 'name'],
                        populate: {
                            path: 'space',
                            select: 'name'
                        }
                    }
                ]
            })
        res.json({
            username: user.username,
            workspaces: user.workspaces,
            _id: user._id,
            assignedTasks: user.assignedTasks,
            newNotifications: user.newNotifications
        })
    })
)

module.exports = router
