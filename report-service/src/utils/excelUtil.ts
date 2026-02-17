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
        `Number of transactions: ${ledger.length - 1}`,
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