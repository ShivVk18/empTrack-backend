export const calculateSalaryComponents = (basicSalary, payParam, employeeType, unpaidLeaveDays = 0) => {
  const basic = Number.parseFloat(basicSalary);
  const multiplier = {
    PERMANENT: 1.0,
    CONTRACT: 0.8,
    INTERN: 0.5,
    CONSULTANT: 0.9,
    PART_TIME: 0.6,
    TEMPORARY: 0.7,
  }[employeeType] || 1.0;

  const da = basic * (payParam.da / 100) * multiplier;
  const ta = basic * (payParam.ta / 100) * multiplier;
  const hra = basic * (payParam.hra / 100) * multiplier;
  const spall = basic * (payParam.spall / 100) * multiplier;

  const medicalAll = payParam.medicalAllFixed > 0
    ? payParam.medicalAllFixed * multiplier
    : basic * (payParam.medicalAllRate / 100) * multiplier;

  const grossSalary = basic + da + ta + hra + spall + medicalAll;

  const epf = (["PERMANENT", "CONTRACT"].includes(employeeType) && basic <= payParam.epfSalaryLimit)
    ? basic * (payParam.epfRate / 100) : 0;

  const esi = (["PERMANENT", "CONTRACT"].includes(employeeType) && grossSalary <= payParam.esiSalaryLimit)
    ? grossSalary * (payParam.esiRate / 100) : 0;

  const tds = grossSalary * (payParam.tdsRate / 100);
  const professionalTax = grossSalary * (payParam.professionalTaxRate / 100);

  const unpaidLeaveDeduction = unpaidLeaveDays * payParam.unpaidLeavePenaltyPerDay;

  const totalDeductions = epf + esi + tds + professionalTax + unpaidLeaveDeduction;
  const netSalary = grossSalary - totalDeductions;

  return {
    basicSalary: basic,
    da,
    ta,
    hra,
    spall,
    medicalAll,
    grossSalary,
    epf,
    esi,
    tds,
    professionalTax,
    unpaidLeaveDeduction,
    totalDeductions,
    netSalary,
  };
};