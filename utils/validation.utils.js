// utils/validation.js
import { ApiError } from "./ApiError.js";

export const validateMonthYear = (month, year) => {
  const currentDate = new Date();
  const targetMonth = month || currentDate.getMonth() + 1;
  const targetYear = year || currentDate.getFullYear();

  if (targetMonth < 1 || targetMonth > 12) {
    throw new ApiError(400, "Invalid month. Must be between 1 and 12");
  }

  if (targetYear < 2023 || targetYear > currentDate.getFullYear() + 1) {
    throw new ApiError(400, "Invalid year");
  }

  return { targetMonth, targetYear };
};

export const validateSalaryInputs = (basicSalary, otherAll, otherDeductions) => {
  if (basicSalary !== undefined) {
    const parsedBasic = Number.parseFloat(basicSalary);
    if (isNaN(parsedBasic) || parsedBasic <= 0) {
      throw new ApiError(400, "Basic salary must be greater than 0");
    }
  }

  const parsedOtherAll = otherAll !== undefined ? Number.parseFloat(otherAll) : 0;
  const parsedOtherDeductions = otherDeductions !== undefined ? Number.parseFloat(otherDeductions) : 0;

  if (isNaN(parsedOtherAll) || parsedOtherAll < 0) {
    throw new ApiError(400, "Other allowances cannot be negative");
  }

  if (isNaN(parsedOtherDeductions) || parsedOtherDeductions < 0) {
    throw new ApiError(400, "Other deductions cannot be negative");
  }

  return { parsedOtherAll, parsedOtherDeductions };
};