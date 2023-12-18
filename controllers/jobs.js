const Job = require('../models/Job')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')
const dayjs = require('dayjs')
const mongoose = require('mongoose')

const getAllJobs = async (req, res) => {
    console.log(req.query)
    const { search, status, jobType, sort } = req.query

    const queryObject = { createdBy: req.user.userId }

    if (search) {
        queryObject.position = { $regex: search, $options: 'i' }
    }
    if (status && status !== 'all') {
        queryObject.status = status
    }
    if (jobType && jobType !== 'all') {
        queryObject.jobType = jobType
    }

    let result = Job.find(queryObject)

    if (sort === 'latest') {
        result = result.sort('-createdAt')
    }
    if (sort === 'oldest') {
        result = result.sort('createdAt')
    }
    if (sort === 'a-z') {
        result = result.sort('position')
    }
    if (sort === 'z-a') {
        result = result.sort('-position')
    }

    // setup pagination
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    result = result.skip(skip).limit(limit)

    const jobs = await result

    const totalJobs = await Job.countDocuments(queryObject)
    const numOfPages = Math.ceil(totalJobs / limit)

    res.status(StatusCodes.OK).json({ jobs, totalJobs, numOfPages })
}

const getJob = async (req, res) => {
    const { user: { userId }, params: { id: jobId } } = req
    const job = await Job.findOne({ createdBy: userId, _id: jobId })
    if (!job) {
        throw new NotFoundError(`No job was found with id ${jobId}.`)
    }
    res.status(StatusCodes.OK).json({ job })
}
const createJob = async (req, res) => {
    req.body.createdBy = req.user.userId
    const job = await Job.create({ ...req.body })
    res.status(StatusCodes.CREATED).json({ job })
}
const updateJob = async (req, res) => {
    const { user: { userId }, params: { id: jobId }, body: { company, position } } = req
    if (!company || !position) {
        throw new BadRequestError('Please provide company and position.')
    }
    const job = await Job.findByIdAndUpdate(
        { _id: jobId, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    )
    if (!job) {
        throw new NotFoundError(`No job was found with id ${jobId}.`)
    }
    res.status(StatusCodes.OK).json({ job })
}
const deleteJob = async (req, res) => {
    const { user: { userId }, params: { id: jobId } } = req
    const job = await Job.findByIdAndDelete({ createdBy: userId, _id: jobId })
    if (!job) {
        throw new NotFoundError(`No job was found with id ${jobId}.`)
    }
    res.status(StatusCodes.OK).send()
}

const getStats = async (req, res) => {
    let stats = await Job.aggregate([
        {
            $match: { createdBy: new mongoose.Types.ObjectId(req.user.userId) }
        },
        {
            $group: { _id: '$status', count: { $sum: 1 } }
        }
    ])
    stats = stats.reduce((pre, curr) => {
        pre[curr._id] = curr.count
        return pre
    }, {})
    const defaultStats = {
        pending: stats.pending || 0,
        interview: stats.interview || 0,
        declined: stats.declined || 0
    }

    let monthlyApplications = await Job.aggregate([
        {
            $match: { createdBy: new mongoose.Types.ObjectId(req.user.userId) }
        },
        {
            $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 }
    ])
    monthlyApplications = monthlyApplications.map((item) => {
        const date = dayjs()
            .month(item._id.month - 1)
            .year(item._id.year)
            .format('MMM YYYY')
        return { date, count: item.count }
    }).reverse()
    res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications })
}

module.exports = {
    getAllJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    getStats
}