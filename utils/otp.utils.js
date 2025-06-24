import crypto from 'crypto'
import { sendEmail } from './email.js'
import { createMessage } from './twilio.util.js'

const generateOTP = () =>  {
    return crypto.randomInt(100000,999999).toString()
}

const generateOTPExpiry = () => {
    return new Date(Date.now() + 5*60*1000)
}

const isValidOTPFormat = (otp) => {
    return /^\d{6}$/.test(otp)
}

const isOTPExpired = (otpExpiry) => {
    return new Date() > new Date(otpExpiry)
}

const sendOTP = async(email,otp,userName) => {
    const emailData =  {
        employeeName :userName,
        opt:otp
    }
   
    
  const template = {
    subject: "Your Login OTP - EmpTrack",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">EmpTrack Login Verification</h2>
        <p>Dear ${userName},</p>
        <p>Your One-Time Password (OTP) for login verification is:</p>
        <div style="background: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p><strong>Important:</strong></p>
        <ul>
          <li>This OTP is valid for <strong>5 minutes</strong> only</li>
          <li>Do not share this OTP with anyone</li>
          <li>If you didn't request this login, please contact your administrator</li>
        </ul>
        <p>Best regards,<br>EmpTrack Security Team</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
  }   

  try {
    const result = await sendEmail(email,template)
    return {success:true,messageId:result.messageId}
  } catch (error) {
    console.error("Failed to send OTP email:", error)
    return { success: false, error: error.message }
  }
}

const sendOTPSMS = async(mobile,otp,userName) => {
    const messageSid = await createMessage(mobile, otp, userName)

    if (messageSid) {
        return { success: true, message: "OTP sent via SMS" }
    } else {
        return { success: false, message: "OTP generation failed" }
    }


}


export {
    sendOTP,
    sendOTPSMS,
    generateOTP,
    generateOTPExpiry,
    isOTPExpired,
    isValidOTPFormat,
}
