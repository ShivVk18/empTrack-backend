import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

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

import adminRoute  from './routes/admin.routes.js'
import employeeRoute from './routes/employee.routes.js'
import departmentRoute from './routes/department.routes.js'
import stateRoute from './routes/stateCity.routes.js'
import designationRoute from './routes/designation.routes.js'


app.use('api/v1/admin',adminRoute)
app.use('api/v1/admin',departmentRoute)
app.use('api/v1/admin',designationRoute)
app.use('api/v1/employee',employeeRoute)
app.use('api/v1/states',stateRoute) 

export {app}