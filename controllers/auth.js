const { BadRequestError, UnauthenticatedError } = require('../errors')
const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')


const register = async (req, res) => {
    const user = await User.create({ ...req.body })
    const token = user.genJWT()
    res.status(StatusCodes.CREATED).json({
        user: {
            email: user.email,
            lastName: user.lastName,
            location: user.location,
            name: user.name,
            token
        }
    })
}

const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        throw new BadRequestError('Please provide email and password.')
    }
    const user = await User.findOne({ email })

    if (!user) {
        throw new UnauthenticatedError('Invalid Credentials.')
    }
    // compare password
    const isPasswordCorrect = await user.verifyPassword(password)
    if (!isPasswordCorrect) {
        throw new UnauthenticatedError('Invalid Credentials.')
    }
    const token = user.genJWT()
    res.status(StatusCodes.OK).json({
        user: {
            email: user.email,
            lastName: user.lastName,
            location: user.location,
            name: user.name,
            token
        }
    })
}

const updateUser = async (req, res) => {
    const { email, name, lastName, location } = req.body
    if (!email || !name || !lastName || !location) {
        throw new BadRequestError('Please provide all values')
    }
    const user = await User.findOne({ _id: req.user.userId })
    user.name = name
    user.email = email
    user.lastName = lastName
    user.location = location
    await user.save()

    const token = user.genJWT()

    res.status(StatusCodes.OK).json({
        user: {
            email: user.email,
            lastName: user.lastName,
            location: user.location,
            name: user.name,
            token
        }
    })
}

module.exports = {
    register,
    login,
    updateUser
}