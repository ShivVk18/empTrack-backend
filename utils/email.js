import nodemailer from  'nodemailer'


const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

const transporter = createTransporter()


const emailTemplates = {
   otpLogin: (data) => ({
    subject: "Your Login OTP - EmpTrack",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">EmpTrack Login Verification</h2>
        <p>Dear ${data.employeeName},</p>
        <p>Your One-Time Password (OTP) for login verification is:</p>
        <div style="background: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${data.otp}</h1>
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
    `
  }) ,

      welcome: (employeeName, companyName, loginCredentials) => ({
    subject: `Welcome to ${companyName} - Your Account Details`,
    html: `
      <h2>Welcome to ${companyName}!</h2>
      <p>Dear ${employeeName},</p>
      <p>Your employee account has been created successfully.</p>
      <div style="background: #f5f5f5; padding: 15px; margin: 20px 0;">
        <h3>Login Credentials:</h3>
        <p><strong>Email:</strong> ${loginCredentials.email}</p>
        <p><strong>Temporary Password:</strong> ${loginCredentials.password}</p>
        <p><strong>Login URL:</strong> ${process.env.FRONTEND_URL}/login</p>
      </div>
      <p>Please change your password after first login.</p>
      <p>Best regards,<br>HR Team</p>
    `,
  }),

  payslip: (employeeName, month, year, salaryDetails) => ({
    subject: `Payslip for ${month}/${year}`,
    html: `
      <h2>Payslip - ${month}/${year}</h2>
      <p>Dear ${employeeName},</p>
      <p>Your salary has been processed for ${month}/${year}.</p>
      <div style="background: #f5f5f5; padding: 15px; margin: 20px 0;">
        <h3>Salary Details:</h3>
        <p><strong>Gross Salary:</strong> ₹${salaryDetails.grossSalary}</p>
        <p><strong>Deductions:</strong> ₹${salaryDetails.totalDeductions}</p>
        <p><strong>Net Salary:</strong> ₹${salaryDetails.netSalary}</p>
      </div>
      <p>Login to view detailed payslip: ${process.env.FRONTEND_URL}/payroll</p>
      <p>Best regards,<br>Payroll Team</p>
    `,
  }),

   passwordReset: (employeeName, resetToken) => ({
    subject: "Password Reset Request",
    html: `
      <h2>Password Reset Request</h2>
      <p>Dear ${employeeName},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <div style="margin: 20px 0;">
        <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" 
           style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </div>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>EmpTrack Team</p>
    `,
  }),
} 

const sendEmail = async(to,templateName,templateData) => {
 try {
    const template = emailTemplates[templateName](templateData)
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@emptrack.com",
      to,
      subject: template.subject,
      html: template.html,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("Email sending failed:", error)
    return { success: false, error: error.message }
  }
}

const sendBulkEmail = async(recipients,templateName,templateData) => {
    const results = []

    for(const recipient of recipients) {
        const result = await sendEmail(recipient.email,templateName, {
           ...templateData ,
           employee:recipient.name
        })
 
        results.push({email:recipient.email, ...result})
    }

    return results
}

export {sendEmail,sendBulkEmail,emailTemplates}

