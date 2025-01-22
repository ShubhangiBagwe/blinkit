import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'
import connectDb from './config/connectDb.js'
import userRouter from './route/user.route.js'

const app = express()

app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL
}))

app.use(express.json())
app.use(cookieParser())
app.use(morgan())
app.use(helmet({
    crossOriginResourcePolicy: false
}))

const PORT = 8000 || process.env.PORT

app.get("/", (request, response) => {
    response.json({
        message: "Server is running " + PORT
    })

})

app.use('/api/user', userRouter)

connectDb().then(() => {
    app.listen(PORT, () => {
        console.log(`server is running on ${PORT}`)
    })
})

