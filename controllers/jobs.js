const Job = require('../models/Job')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')

const getAllJobs = async (req, res) => {
    const jobs = await Job.find({ createdBy: req.user.userId }).sort('createdAt')
    res.status(StatusCodes.OK).json({ jobs, count: jobs.length })
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
module.exports = {
    getAllJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob
}