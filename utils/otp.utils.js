import crypto from 'crypto'
import { sendEmail } from './email.js'


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

const sendOTPEmail = async (email, otp, userName) => {
  const emailData = {
    employeeName: userName,
    otp: otp 
  };
  
  try {
    console.log('Sending OTP email...');
    const result = await sendEmail(email, 'otpLogin', emailData);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return { success: false, error: error.message };
  }
};



export {
    sendOTPEmail,
    generateOTP,
    generateOTPExpiry,
    isOTPExpired,
    isValidOTPFormat,
}
