import ExcelJS from "exceljs";
import { Request, Response } from "express";

export function createTransactionLedgerSheet(
    ledger: any[],
    fromDate: string,
    toDate: string,
    spacesNames: Set<string>,
    isCollaborative: boolean,
    openingBalance: number
) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Transaction Ledger");

    let currentRow = 1;

    const totalColumns = isCollaborative ? 9 : 8;

    // ==============================
    // TITLE
    // ==============================
    worksheet.mergeCells(`A${currentRow}:${isCollaborative ? "I" : "H"}${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = "Transaction Ledger";
    titleCell.font = { size: 16, bold: true };
    // titleCell.alignment = { horizontal: "center", vertical: 'middle' };
    currentRow += 2;

    // ==============================
    // INFO SECTION
    // ==============================
    const infoRows = [
        `From: ${fromDate}`,
        `To: ${toDate}`,
        `Spaces: ${Array.from(spacesNames).join(", ")}`,
        `Generated on: ${new Date().toLocaleString()}`,
        `Number of transactions: ${ledger.length }`,
        `Opening Balance: ${openingBalance.toFixed(2)}`
    ];

    infoRows.forEach(text => {
        worksheet.mergeCells(`A${currentRow}:${isCollaborative ? "I" : "H"}${currentRow}`);
        const infocell = worksheet.getCell(`A${currentRow}`);
        infocell.value = text;
        infocell.font = { size: 12 };
        infocell.alignment = { horizontal: "left", vertical: 'middle' };
        currentRow++;
    });
    currentRow += 2;

    // ==============================
    // TABLE HEADER
    // ==============================
    const headers = [
        "Space",
        "Type",
        ...(isCollaborative ? ["Member"] : []),
        "Date",
        "Category",
        "SubCategory",
        "Debit",
        "Credit",
        "Balance"
    ];

    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = headers;

    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "left" };
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF4F4F4" }
    };

    currentRow++;

    // ==============================
    // OPENING BALANCE ROW
    // ==============================
    const openingRow = worksheet.addRow([
        "OPENING BALANCE"
    ]);

    worksheet.mergeCells(
        `A${currentRow}:${String.fromCharCode(
            64 + (isCollaborative ? 8 : 7)
        )}${currentRow}`
    );

    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`A${currentRow}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9EDF7" }
    };

    worksheet.getCell(currentRow, totalColumns).value = openingBalance;
    worksheet.getCell(currentRow, totalColumns).numFmt = "#,##0.00";
    worksheet.getCell(currentRow, totalColumns).font = { bold: true };
    worksheet.getCell(currentRow, totalColumns).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9EDF7" }
    };
    worksheet.getCell(currentRow, totalColumns).alignment = { horizontal: "right" };

    currentRow++;

    // ==============================
    // TRANSACTION ROWS
    // ==============================
    const transactionRows = ledger.slice(0, ledger.length - 1);

    transactionRows.forEach((row: any) => {
        worksheet.addRow([
            row.spaceName,
            row.transactionType,
            ...(isCollaborative ? [row.username || ""] : []),
            row.date,
            row.mainCategory,
            row.subCategory,
            row.moneyIn,
            row.moneyOut,
            row.balance
        ]);
        const debitcell = worksheet.getCell(currentRow, isCollaborative ? 7 : 6);
        const creditcell = worksheet.getCell(currentRow, isCollaborative ? 8 : 7);
        const balancecell = worksheet.getCell(currentRow, isCollaborative ? 9 : 8);

        debitcell.numFmt = "#,##0.00";
        creditcell.numFmt = "#,##0.00";
        balancecell.numFmt = "#,##0.00";

        debitcell.alignment = { horizontal: "right" };
        creditcell.alignment = { horizontal: "right" };
        balancecell.alignment = { horizontal: "right" };
        currentRow++;
    });

    // // Format money columns
    // worksheet.columns.forEach((col, index) => {
    //     if (["Debit", "Credit", "Balance"].includes(headers[index])) {
    //         col.numFmt = "#,##0.00";
    //         col.alignment = { horizontal: "right" };
    //     }
    // });

    // ==============================
    // FINAL BALANCE ROW
    // ==============================
    const final = ledger[ledger.length - 1];

    worksheet.addRow([
        "FINAL BALANCE",
        "",
        ...(isCollaborative ? [""] : []),
        "",
        "",
        "",
        final.moneyIn,
        final.moneyOut,
        final.balance
    ]);

    const finalRow = worksheet.getRow(currentRow);
    finalRow.font = { bold: true };
    finalRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDFF0D8" }
    };
    finalRow.getCell(isCollaborative ? 7 : 6).numFmt = "#,##0.00";
    finalRow.getCell(isCollaborative ? 8 : 7).numFmt = "#,##0.00";
    finalRow.getCell(isCollaborative ? 9 : 8).numFmt = "#,##0.00";

    finalRow.getCell(isCollaborative ? 7 : 6).alignment = { horizontal: "right" };
    finalRow.getCell(isCollaborative ? 8 : 7).alignment = { horizontal: "right" };
    finalRow.getCell(isCollaborative ? 9 : 8).alignment = { horizontal: "right" };

    // ==============================
    // COLUMN WIDTHS
    // ==============================
    worksheet.columns.forEach(col => {
        col.width = 18;
    });

    // Freeze header
    worksheet.views = [{ state: "frozen", ySplit: 11 }];

    return workbook;

}

export function createLoanLedgerSheet(
    ledger: any[],
    fromDate: string,
    toDate: string,
    loanAmount: number,
    loanStartDate: string,
    loanEndDate: string,
    interestRate: string,
    totalInterest: string
) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Transaction Ledger");

    let currentRow = 1;

    const totalColumns = 9;

    // ==============================
    // TITLE
    // ==============================
    worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + totalColumns)}${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = "Loan Ledger";
    titleCell.font = { size: 16, bold: true };
    currentRow += 2;

    // ==============================
    // INFO SECTION
    // ==============================
    const infoRows = [
        `Loan amount: ${loanAmount.toFixed(2)}`,
        `Loan start date: ${loanStartDate}`,
        `Loan end date: ${loanEndDate}`,
        `Interest Rate (Monthly): ${interestRate}%`,
        `Total interest: ${totalInterest}`,
        `From: ${fromDate}`,
        `To: ${toDate}`,
        `Generated on: ${new Date().toLocaleString()}`,
        `Number of transactions: ${ledger.length}`
    ];

    infoRows.forEach(text => {
        worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + totalColumns)}${currentRow}`);
        const infocell = worksheet.getCell(`A${currentRow}`);
        infocell.value = text;
        infocell.font = { size: 12 };
        infocell.alignment = { horizontal: "left", vertical: 'middle' };
        currentRow++;
    });
    currentRow += 2;

    // ==============================
    // TABLE HEADER
    // ==============================
    const headers = [
        "Space",
        "Type",
        "Date",
        "Category",
        "SubCategory",
        "Amount",
        "Outstanding Principal",
        "Cumulative Interest",
        "Cumulative Charges"
    ];

    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = headers;

    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "left" };
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF4F4F4" }
    };

    currentRow++;

    // ==============================
    // TRANSACTION ROWS
    // ==============================
    const transactionRows = ledger;

    transactionRows.forEach((row: any) => {
        worksheet.addRow([
            row.spaceName,
            row.transactionType,
            row.date,
            row.mainCategory,
            row.subCategory,
            row.amount,
            row.remainingBalance,
            row.cumulativeInterest,
            row.cumulativeCharges
        ]);
        const amountCell = worksheet.getCell(currentRow, 6);
        const remainingBalanceCell = worksheet.getCell(currentRow, 7);
        const cumulativeInterestCell = worksheet.getCell(currentRow, 8);
        const cumulativeChargesCell = worksheet.getCell(currentRow, 9);

        amountCell.numFmt = "#,##0.00";
        remainingBalanceCell.numFmt = "#,##0.00";
        cumulativeInterestCell.numFmt = "#,##0.00";
        cumulativeChargesCell.numFmt = "#,##0.00";

        amountCell.alignment = { horizontal: "right" };
        remainingBalanceCell.alignment = { horizontal: "right" };
        cumulativeInterestCell.alignment = { horizontal: "right" };
        cumulativeChargesCell.alignment = { horizontal: "right" };
        currentRow++;
    });

    // ==============================
    // COLUMN WIDTHS
    // ==============================
    worksheet.columns.forEach(col => {
        col.width = 18;
    });

    // Freeze header
    worksheet.views = [{ state: "frozen", ySplit: 11 }];

    return workbook;

}

export function createCreditCardLedgerSheet(
    ledger: any[],
    fromDate: string,
    toDate: string,
    openingBalance: number,
    creditLimit: number
) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Credit Card Ledger");
    let currentRow = 1;

    const totalColumns = 7;

    // ==============================
    // TITLE
    // ==============================
    worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + totalColumns)}${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = "Credit Card Ledger";
    titleCell.font = { size: 16, bold: true };
    // titleCell.alignment = { horizontal: "center", vertical: 'middle' };
    currentRow += 2;

    // ==============================
    // INFO SECTION
    // ==============================
    const infoRows = [
        `Credit card limit: ${creditLimit.toFixed(2)}`,
        `From: ${fromDate}`,
        `To: ${toDate}`,
        `Generated on: ${new Date().toLocaleString()}`,
        `Number of transactions: ${ledger.length }`,
        `Opening Balance: ${openingBalance.toFixed(2)}`
    ];

    infoRows.forEach(text => {
        worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + totalColumns)}${currentRow}`);
        const infocell = worksheet.getCell(`A${currentRow}`);
        infocell.value = text;
        infocell.font = { size: 12 };
        infocell.alignment = { horizontal: "left", vertical: 'middle' };
        currentRow++;
    });
    currentRow += 2;

    // ==============================
    // TABLE HEADER
    // ==============================
    const headers = [
        "Space",
        "Type",
        "Date",
        "Category",
        "SubCategory",
        "Amount",
        "Total outstanding"
    ];

    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = headers;

    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "left" };
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF4F4F4" }
    };

    currentRow++;

    // ==============================
    // OPENING BALANCE ROW
    // ==============================
    const openingRow = worksheet.addRow([
        "OPENING BALANCE"
    ]);

    worksheet.mergeCells(
        `A${currentRow}:${String.fromCharCode(
            64 + totalColumns
        )}${currentRow}`
    );

    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`A${currentRow}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9EDF7" }
    };

    worksheet.getCell(currentRow, totalColumns).value = openingBalance;
    worksheet.getCell(currentRow, totalColumns).numFmt = "#,##0.00";
    worksheet.getCell(currentRow, totalColumns).font = { bold: true };
    worksheet.getCell(currentRow, totalColumns).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9EDF7" }
    };
    worksheet.getCell(currentRow, totalColumns).alignment = { horizontal: "right" };

    currentRow++;

    // ==============================
    // TRANSACTION ROWS
    // ==============================
    const transactionRows = ledger;

    transactionRows.forEach((row: any) => {
        worksheet.addRow([
            row.spaceName,
            row.transactionType,
            row.date,
            row.mainCategory,
            row.subCategory,
            row.amount,
            row.balance
        ]);
        const amountcell = worksheet.getCell(currentRow, 6);
        const balanceCell = worksheet.getCell(currentRow, 7);

        amountcell.numFmt = "#,##0.00";
        balanceCell.numFmt = "#,##0.00";

        amountcell.alignment = { horizontal: "right" };
        balanceCell.alignment = { horizontal: "right" };

        currentRow++;
    });

    // ==============================
    // COLUMN WIDTHS
    // ==============================
    worksheet.columns.forEach(col => {
        col.width = 18;
    });

    // Freeze header
    worksheet.views = [{ state: "frozen", ySplit: 11 }];

    return workbook;
}

export function createIncomeVsExpenseSheet(
    reportData: any,
    fromDate: string,
    toDate: string,
    spacesNames: Set<string>
) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Income vs Expense");
    let currentRow = 1;

    // TITLE
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = "Income vs Expense Report";
    titleCell.font = { size: 16, bold: true };
    currentRow += 2;

    // INFO SECTION
    const infoRows = [
        `From: ${fromDate}`,
        `To: ${toDate}`,
        `Spaces: ${Array.from(spacesNames).join(", ")}`,
        `Generated on: ${new Date().toLocaleString()}`
    ];
    infoRows.forEach(text => {
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = text;
        currentRow++;
    });
    currentRow += 2;

    // SUMMARY AREA
    worksheet.getCell(`A${currentRow}`).value = "Summary";
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow++;

    const summaryHeaders = ["Metric", "Amount"];
    worksheet.getRow(currentRow).values = summaryHeaders;
    worksheet.getRow(currentRow).font = { bold: true };
    currentRow++;

    worksheet.addRow(["Total Income", reportData.totalIncome]);
    worksheet.getCell(`B${currentRow}`).numFmt = "#,##0.00";
    currentRow++;
    worksheet.addRow(["Total Expense", reportData.totalExpense]);
    worksheet.getCell(`B${currentRow}`).numFmt = "#,##0.00";
    currentRow++;
    const netIncomeRow = worksheet.addRow(["Net Income", reportData.netIncome]);
    netIncomeRow.font = { bold: true };
    worksheet.getCell(`B${currentRow}`).numFmt = "#,##0.00";
    currentRow += 2;

    // INCOME DETAILS
    worksheet.getCell(`A${currentRow}`).value = "Income Details";
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow++;
    
    worksheet.getRow(currentRow).values = ["Category", "Amount"];
    worksheet.getRow(currentRow).font = { bold: true };
    currentRow++;
    
    reportData.incomeByCategory.forEach((row: any) => {
        worksheet.addRow([row.category, row.amount]);
        worksheet.getCell(`B${currentRow}`).numFmt = "#,##0.00";
        currentRow++;
    });
    currentRow++;

    // EXPENSE DETAILS
    worksheet.getCell(`A${currentRow}`).value = "Expense Details";
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow++;
    
    worksheet.getRow(currentRow).values = ["Category", "Amount"];
    worksheet.getRow(currentRow).font = { bold: true };
    currentRow++;
    
    reportData.expenseByCategory.forEach((row: any) => {
        worksheet.addRow([row.category, row.amount]);
        worksheet.getCell(`B${currentRow}`).numFmt = "#,##0.00";
        currentRow++;
    });

    worksheet.columns.forEach(col => { col.width = 30; });
    return workbook;
}

export function createBudgetUtilizationSheet(
    budgets: any[],
    fromDate: string,
    toDate: string,
    spacesNames: Set<string>
) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Budget Utilization");
    let currentRow = 1;

    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = "Budget Utilization Report";
    titleCell.font = { size: 16, bold: true };
    currentRow += 2;

    const infoRows = [
        `From: ${fromDate}`,
        `To: ${toDate}`,
        `Spaces: ${Array.from(spacesNames).join(", ")}`,
        `Generated on: ${new Date().toLocaleString()}`
    ];
    infoRows.forEach(text => {
        worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = text;
        currentRow++;
    });
    currentRow += 2;

    const headers = ["Space", "Category", "Sub Category", "Allocated", "Spent", "Remaining", "Utilization (%)"];
    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = headers;
    headerRow.font = { bold: true };
    currentRow++;

    budgets.forEach((row: any) => {
        worksheet.addRow([
            row.spaceName,
            row.category,
            row.subCategory || "All",
            row.allocated,
            row.spent,
            row.remaining,
            row.utilizationPercentage
        ]);
        worksheet.getCell(currentRow, 4).numFmt = "#,##0.00";
        worksheet.getCell(currentRow, 5).numFmt = "#,##0.00";
        worksheet.getCell(currentRow, 6).numFmt = "#,##0.00";
        worksheet.getCell(currentRow, 7).numFmt = "0.00";
        currentRow++;
    });

    worksheet.columns.forEach(col => { col.width = 18; });
    return workbook;
}

export function createLoanRepaymentSummarySheet(
    summaryData: any[],
    toDate: string,
    spacesNames: Set<string>
) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Loan Repayment Summary");
    let currentRow = 1;

    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = "Loan Repayment Summary";
    titleCell.font = { size: 16, bold: true };
    currentRow += 2;

    const infoRows = [
        `As of: ${toDate}`,
        `Spaces: ${Array.from(spacesNames).join(", ")}`,
        `Generated on: ${new Date().toLocaleString()}`
    ];
    infoRows.forEach(text => {
        worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = text;
        currentRow++;
    });
    currentRow += 2;

    const headers = [
        "Space", "Total Loan Amount", "Total Paid Base", 
        "Remaining Principal", "Total Interest Paid", 
        "Total Charges Paid", "Monthly Interest Rate (%)"
    ];
    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = headers;
    headerRow.font = { bold: true };
    currentRow++;

    summaryData.forEach((row: any) => {
        worksheet.addRow([
            row.spaceName,
            row.totalLoanAmount,
            row.totalPaidBase,
            row.remainingPrincipal,
            row.totalInterestPaid,
            row.totalChargesPaid,
            row.monthlyInterestRate || "N/A"
        ]);
        worksheet.getCell(currentRow, 2).numFmt = "#,##0.00";
        worksheet.getCell(currentRow, 3).numFmt = "#,##0.00";
        worksheet.getCell(currentRow, 4).numFmt = "#,##0.00";
        worksheet.getCell(currentRow, 5).numFmt = "#,##0.00";
        worksheet.getCell(currentRow, 6).numFmt = "#,##0.00";
        currentRow++;
    });

    worksheet.columns.forEach(col => { col.width = 22; });
    return workbook;
}

export function createFinancialPositionSheet(
    reportData: any,
    toDate: string
) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Financial Position");
    let currentRow = 1;

    worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = "Statement of Financial Position";
    titleCell.font = { size: 16, bold: true };
    currentRow += 2;

    const infoRows = [
        `As of: ${toDate}`,
        `Generated on: ${new Date().toLocaleString()}`
    ];
    infoRows.forEach(text => {
        worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = text;
        currentRow++;
    });
    currentRow += 2;

    // SUMMARY AREA
    worksheet.getCell(`A${currentRow}`).value = "Summary";
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow++;

    const summaryHeaders = ["Metric", "Amount"];
    worksheet.getRow(currentRow).values = summaryHeaders;
    worksheet.getRow(currentRow).font = { bold: true };
    currentRow++;

    worksheet.addRow(["Total Assets", reportData.totalAssets]);
    worksheet.getCell(`B${currentRow}`).numFmt = "#,##0.00";
    currentRow++;
    worksheet.addRow(["Total Liabilities", reportData.totalLiabilities]);
    worksheet.getCell(`B${currentRow}`).numFmt = "#,##0.00";
    currentRow++;
    const netRow = worksheet.addRow(["Net Worth", reportData.netWorth]);
    netRow.font = { bold: true };
    worksheet.getCell(`B${currentRow}`).numFmt = "#,##0.00";
    currentRow += 2;

    // ASSETS
    worksheet.getCell(`A${currentRow}`).value = "Assets Breakdown";
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow++;
    
    worksheet.getRow(currentRow).values = ["Space", "Type", "Balance"];
    worksheet.getRow(currentRow).font = { bold: true };
    currentRow++;
    
    reportData.assets.forEach((row: any) => {
        worksheet.addRow([row.spaceName, row.type, row.balance]);
        worksheet.getCell(`C${currentRow}`).numFmt = "#,##0.00";
        currentRow++;
    });
    currentRow++;

    // LIABILITIES
    worksheet.getCell(`A${currentRow}`).value = "Liabilities Breakdown";
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow++;
    
    worksheet.getRow(currentRow).values = ["Space", "Type", "Balance (Outstanding)"];
    worksheet.getRow(currentRow).font = { bold: true };
    currentRow++;
    
    reportData.liabilities.forEach((row: any) => {
        worksheet.addRow([row.spaceName, row.type, row.balance]);
        worksheet.getCell(`C${currentRow}`).numFmt = "#,##0.00";
        currentRow++;
    });

    worksheet.columns.forEach(col => { col.width = 30; });
    return workbook;
}