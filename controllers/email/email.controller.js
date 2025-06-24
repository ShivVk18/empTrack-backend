import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { sendEmail } from "../../utils/email.js";
import prisma from "../../config/prismaClient.js";
import { generateResetToken } from "../../utils/tokenGenerator.js";

const sendWelcomeEmail = async (employeeData, temporaryPassword) => {
  try {
    const emailData = {
      employeeName: employeeData.name,
      companyName: employeeData.company?.name || "Your Company",
      loginCredentials: {
        email: employeeData.email,
        password: temporaryPassword,
      },
    };

    return await sendEmail(employeeData.email, "welcome", emailData);
  } catch (error) {
    return error.message;
  }
};

const sendPayslipEmails = asyncHandler(async (req, res) => {
  const { month, year, employeeIds } = req.body;
  const companyId = req.user?.companyId;

  const salaryRecords = await prisma.payMaster.findMany({
    where: {
      companyId,
      month: Number.parseInt(month),
      year: Number.parseInt(year),
      ...(employeeIds && {
        employeeId: { in: employeeIds.map((id) => Number.parseInt(id)) },
      }),
    },
    include: {
      employee: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (salaryRecords.length === 0) {
    throw new ApiError(
      404,
      "No salary records found for the specified criteria"
    );
  }

  const emailResults = [];
  for (const record of salaryRecords) {
    const emailData = {
      employeeName: record.employee.name,
      month,
      year,
      salaryDetails: {
        grossSalary: record.grossSalary,
        totalDeductions: record.totalDeductions,
        netSalary: record.netSalary,
      },
    };

    const result = await sendEmail(record.employee.email, "payslip", emailData);
    emailResults.push({
      employeeId: record.employeeId,
      email: record.employee.email,
      ...result,
    });
  }

  const successCount = emailResults.filter((r) => r.success).length;
  const failureCount = emailResults.filter((r) => !r.success).length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalEmails: emailResults.length,
        successCount,
        failureCount,
        results: emailResults,
      },
      `Payslip emails sent: ${successCount} successful, ${failureCount} failed`
    )
  );
});

const sendPasswordResetEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  let user = await prisma.admin.findUnique({ where: { email } });
  let userType = "admin";

  if (!user) {
    user = await prisma.employee.findUnique({ where: { email } });
    userType = "employee";
  }

  if (!user) {
    throw new ApiError(404, "User not found with this email");
  }

  const resetToken = generateResetToken();

  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  if (userType === "admin") {
    await prisma.admin.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });
  } else {
    await prisma.employee.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });
  }

  const emailData = {
    employeeName: user.name,
    resetToken,
  };

  const result = await sendEmail(email, "passwordReset", emailData);

  if (!result.success) {
    throw new ApiError(500, "Failed to send password reset email");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset email sent successfully"));
});

export { sendWelcomeEmail, sendPasswordResetEmail, sendPayslipEmails };
