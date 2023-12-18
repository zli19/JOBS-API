require('dotenv').config()

const mockData = require('./mock_data.json')

const connectDB = require('./db/connect')
const Job = require('./models/Job')

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI)

        await Job.create(mockData)
        console.log('success!')
        process.exit(0)
    } catch (error) {
        console.log(error)
        proccess.exit(1)
    }
}
start()