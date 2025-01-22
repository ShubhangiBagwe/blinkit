import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import VerifyEmailTemplate from '../utils/verifyEmailTemplate.js'
import sendEmail from '../config/sendEmail.js'

export async function registerUserController(request, response) {
    try {
        const { name, email, password } = request.body

        if (!name || !name || !password) {
            return response.status(400).json({
                message: "Provide email, name, passowrd",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({ email })

        if (user) {
            return response.json({
                message: "Already register email",
                error: true,
                success: false
            })
        }

        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(password, salt)

        const payload = {
            name,
            email,
            password: hashPassword
        }

        const newUser = new UserModel(payload)
        const save = await newUser.save()

        const VerifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`

        const verifyEmail = await sendEmail({
            sendTo: email,
            subject: "Verify email from blinkit",
            html: VerifyEmailTemplate({
                name,
                url: VerifyEmailUrl
            })
        })

        return response.json({
            message: "User Register Successfully",
            error: false,
            success: true,
            data:save
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}