import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middlewares/error.middleware.js'

const app = express()

// Secure HTTP headers
app.use(helmet())

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100000 : 500, // Limit each IP to 500 requests per windowMs (100k for development)
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({
     extended:true,limit:'16kb'
}))

app.use(express.static('public'))
app.use(cookieParser())

import routes from './routes/index.js'

app.use(routes)


app.use(errorHandler)

export {app}