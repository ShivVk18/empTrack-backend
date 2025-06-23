import twilio from 'twilio'

const accountSid = process.env.TWILIO_SID 
const authToken = process.env.TWILIO_AUTH_TOKEN 

const client = twilio(accountSid,authToken)

const createMessage = async(mobile,otp,userName) => {
    const message = await client.messages.create({
        body:`SMS OTP for ${userName} (${mobile}): ${otp}`,
        from:process.env.TWILIO_PHONE_NUMBER,
        to:mobile
    })

    return message.body
}

export {createMessage}