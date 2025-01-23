import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import VerifyEmailTemplate from '../utils/verifyEmailTemplate.js'
import sendEmail from '../config/sendEmail.js'
import generatedAccessToken from '../utils/generatedAccessToken.js'
import generatedRefreshToken from '../utils/generatedRefreshToken.js'
import uploadImageCloudinary from '../utils/uploadImageCloudary.js'
import generatedOtp from '../utils/generatedOtp.js'
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js'

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
            data: save
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}


export async function verifyEmailController(request, response) {
    try {
        const { code } = request.body

        const user = await UserModel.findOne({ _id: code })

        if (!user) {
            return response.status(400).json({
                message: "Invalid code",
                error: true,
                success: false
            })
        }

        const updateUser = await UserModel.updateOne({ _id: code }, {
            verify_email: true
        })

        return response.json({
            message: "Verify email done",
            success: true,
            error: false
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: true
        })
    }
}


// login controller

export async function loginController(request, response) {
    try {
        const { email, password } = request.body

        if (!email || !password) {
            return response.status(400).json({
                message: "Provide Email and password",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({ email })

        if (!user) {
            return response.status(400).json({
                message: "User not register",
                error: true,
                success: false
            })
        }

        if (user.status != "Active") {
            return response.status(400).json({
                message: "Contact to Admin",
                error: true,
                success: false
            })
        }

        const checkPassword = await bcryptjs.compare(password, user.password)

        if (!checkPassword) {
            return response.status(400).json({
                message: "Check the password",
                error: true,
                success: false
            })
        }

        const accessToken = await generatedAccessToken(user._id)
        const refreshToken = await generatedRefreshToken(user._id)

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }

        response.cookie('accessToken', accessToken, cookiesOption)
        response.cookie('refreshToken', refreshToken, cookiesOption)

        return response.json({
            message: "Login Successfully",
            error: false,
            success: true,
            date: {
                accessToken,
                refreshToken
            }
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// logout controller

export async function logoutController(request, response) {
    try {
        const userid = request.userId
        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }
        response.clearCookie("accessToken", cookiesOption)
        response.clearCookie("refreshToken", cookiesOption)

        const removeAccessToken = await UserModel.findByIdAndUpdate(userid, {
            refresh_token: ""
        })

        return response.json({
            message: "Logout Successfully",
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// upload user avtar

export async function uploadAvatar(request, response) {
    try {
        const userId = request.userId //auth middleware
        const image = request.file  //multer middleware
        const upload = await uploadImageCloudinary(image)

        const updateUser = await UserModel.findByIdAndUpdate(userId, {
            avatar: upload.url
        })

        return response.json({
            message: "upload profile",
            data: {
                _id: userId,
                avatar: upload.url
            }
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }


}


// update user details

export async function updateUserDetails(request, response) {
    try {
        const userId = request.userId  //auth middleware
        const { name, email, mobile, password } = request.body

        let hashPassword = ""

        if (password) {
            const salt = await bcryptjs.genSalt(10)
            hashPassword = await bcryptjs.hash(password, salt)
        }

        const updateUser = await UserModel.updateOne({ _id: userId }, {
            ...(name && { name: name }),
            ...(email && { email: email }),
            ...(mobile && { mobile: mobile }),
            ...(password && { password: hashPassword })
        })

        return response.json({
            message: "Updated User Successfully",
            error: false,
            success: true,
            data: updateUser
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || message,
            error: true,
            success: false
        })
    }
}


// forgot password

export async function forgotPasswordController(request, response) {
    try {
        const { email } = request.body
        const user = await UserModel.findOne({ email })

        if (!user) {
            return response.status(400).json({
                message: "Email is not available",
                error: true,
                success: false
            })
        }

        const otp = generatedOtp()

        const expireTime = new Date() + 60 * 60 * 1000  //1hr

        const update = await UserModel.findByIdAndUpdate(user._id, {
            forgot_password_otp: otp,
            forgot_password_expiry: new Date(expireTime).toISOString()
        })

        await sendEmail({
            sendTo: email,
            subject: "Forgot password from blinkit",
            html: forgotPasswordTemplate({
                name: user.name,
                otp: otp
            })
        })

        return response.json({
            message: "Check your Email",
            error: false,
            success: true
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


// verify forgot password otp

export async function verifyForgotPasswordOtp(request, response) {
    try {
        const { email, otp } = request.body

        if (!email || !otp) {
            return response.status(400).json({
                message: "Provide required field email,otp",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({email})

        if(!user){
            return response.status(400).json({
                message: "Email not available",
                error: true,
                success: false
            })
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}