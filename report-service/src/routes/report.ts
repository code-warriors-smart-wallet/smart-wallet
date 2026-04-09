import express, { Request, Response } from 'express';
import Transaction, { TransactionType } from '../models/transaction';
import Space from '../models/space';
import { authenticate } from '../middlewares/auth';
import mongoose from 'mongoose';
import { toTitleCase } from '../utils/commonUtil';
import { getUsersBySpace } from './dashboard';
import { generateCreditCardLedgerHTML, generateLoanLedgerHTML, generateTransactionLedgerHTML, generateIncomeVsExpenseHTML, generateBudgetUtilizationHTML, generateLoanRepaymentSummaryHTML, generateFinancialPositionHTML } from '../utils/templateUtil';
import { getPdfFromHTML } from '../utils/pdfUtil';
import { createCreditCardLedgerSheet, createLoanLedgerSheet, createTransactionLedgerSheet, createIncomeVsExpenseSheet, createBudgetUtilizationSheet, createLoanRepaymentSummarySheet, createFinancialPositionSheet } from '../utils/excelUtil';

const reportRouter = express.Router();
const ObjectId = mongoose.Types.ObjectId;

reportRouter.post('/transaction-ledger', authenticate, async (req: Request, res: Response) => {
  try {
    const userId: string = (req as any).user.id;
    const { fromDate, toDate, spaces, format, isCollaborative } = req.body;

    // Validate input
    if (!fromDate || !toDate || !spaces || !Array.isArray(spaces) || spaces.length === 0 || !format || isCollaborative === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'fromDate, toDate, spaces, format, and isCollaborative are required' },
        data: null
      });
    }

    // opening balance
    const moneyIn = await Transaction.aggregate([
      {
        $match: {
          userId: {
            $in:
              isCollaborative && spaces.length === 1
                ? await getUsersBySpace(spaces[0])
                : [new ObjectId(userId)],
          },
          date: { $lt: new Date(fromDate) },
          to: { $in: spaces.map((id: string) => new ObjectId(id)) },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);
    const moneyOut = await Transaction.aggregate([
      {
        $match: {
          userId: {
            $in:
              isCollaborative && spaces.length === 1
                ? await getUsersBySpace(spaces[0])
                : [new ObjectId(userId)],
          },
          date: { $lt: new Date(fromDate) },
          from: { $in: spaces.map((id: string) => new ObjectId(id)) },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);


    const totalMoneyIn = moneyIn[0]?.total || 0;
    const totalMoneyOut = moneyOut[0]?.total || 0;
    const openingBalance = totalMoneyIn - totalMoneyOut;

    // Fetch transactions for the specified spaces and date range
    const transactions = await Transaction.find({
      $and: [
        {
          $or: [
            { from: { $in: spaces.map((id: string) => new ObjectId(id)) } },
            { to: { $in: spaces.map((id: string) => new ObjectId(id)) } }
          ]
        },
        { date: { $gte: new Date(fromDate), $lte: new Date(toDate) } },
        { userId: spaces.length === 1 && isCollaborative ? { $in: await getUsersBySpace(spaces[0]) } : new ObjectId(userId) }
      ]
    })
      .populate("to", "name")
      .populate("from", "name")
      .populate("pcategory", "parentCategory subCategories")
      .populate("userId", "username")
      .sort({ date: 1 });

    let runningBalance = openingBalance;
    let spacesNames: Set<string> = new Set();

    // Transform transactions into ledger format
    const ledger: any[] = transactions.flatMap(tx => {
      const amount = parseFloat(tx.amount.toString());
      let scategoryName = null;
      if (tx.pcategory && tx.scategory) {
        const sub = (tx.pcategory as any).subCategories.find(
          (subCat: any) => subCat._id.toString() === tx.scategory.toString()
        );
        if (sub) scategoryName = sub.name;
      }

      if (spaces.includes((tx.to as any)?._id.toString() || "") && spaces.includes((tx.from as any)?._id?.toString() || "")) {
        runningBalance += amount;   // first add
        const balanceAfterIn = runningBalance;

        runningBalance -= amount;   // then subtract
        const balanceAfterOut = runningBalance;

        spacesNames.add((tx.to as any)?.name || "");
        spacesNames.add((tx.from as any)?.name || "");

        return [{
          spaceName: (tx.to as any)?.name || "",
          transactionType: toTitleCase(tx.type),
          username: (tx.userId as any)?.username || "",
          date: tx.date.toString().split(" ").splice(1, 3).join(" "),
          mainCategory: (tx.pcategory as any)?.parentCategory || "",
          subCategory: scategoryName ? toTitleCase(scategoryName) : "",
          moneyIn: amount,
          moneyOut: 0,
          balance: balanceAfterIn
        }, {
          spaceName: (tx.from as any)?.name || "",
          transactionType: toTitleCase(tx.type),
          username: (tx.userId as any)?.username || "",
          date: tx.date.toString().split(" ").splice(1, 3).join(" "),
          mainCategory: (tx.pcategory as any)?.parentCategory || "",
          subCategory: scategoryName ? toTitleCase(scategoryName) : "",
          moneyIn: 0,
          moneyOut: amount,
          balance: balanceAfterOut
        }]
      } // this should b esplitted as 2 rows
      else if (spaces.includes((tx.to as any)?._id.toString() || "")) {
        spacesNames.add((tx.to as any)?.name || "");
        runningBalance += amount;
        return [{
          spaceName: (tx.to as any)?.name || "",
          transactionType: toTitleCase(tx.type),
          username: (tx.userId as any)?.username || "",
          date: tx.date.toString().split(" ").splice(1, 3).join(" "),
          mainCategory: (tx.pcategory as any)?.parentCategory || "",
          subCategory: scategoryName ? toTitleCase(scategoryName) : "",
          moneyIn: amount,
          moneyOut: 0,
          balance: runningBalance
        }]
      } else if (spaces.includes((tx.from as any)?._id?.toString() || "")) {
        spacesNames.add((tx.from as any)?.name || "");
        runningBalance -= amount;
        return [{
          spaceName: (tx.from as any)?.name || "",
          transactionType: toTitleCase(tx.type),
          username: (tx.userId as any)?.username || "",
          date: tx.date.toString().split(" ").splice(1, 3).join(" "),
          mainCategory: (tx.pcategory as any)?.parentCategory || "",
          subCategory: scategoryName ? toTitleCase(scategoryName) : "",
          moneyIn: 0,
          moneyOut: amount,
          balance: runningBalance
        }]
      } else {
        return [];
      }
    });

    const totalIn = ledger.reduce((sum, row) => sum + (row?.moneyIn || 0), 0);
    const totalOut = ledger.reduce((sum, row) => sum + (row?.moneyOut || 0), 0);

    ledger.push({
      spaceName: "TOTAL",
      transactionType: "",
      date: "",
      mainCategory: "",
      subCategory: "",
      moneyIn: totalIn,
      moneyOut: totalOut,
      balance: runningBalance
    });

    if (format === "PDF") {
      const html = generateTransactionLedgerHTML(
        ledger,
        fromDate,
        toDate,
        isCollaborative,
        openingBalance,
        spacesNames
      )

      const pdfBuffer = await getPdfFromHTML(html);

      res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdfBuffer.length, "Content-Disposition": `attachment; filename="Account Ledger (${fromDate}-${toDate}).pdf"` });
      res.status(200).send(Buffer.from(pdfBuffer));
    } else if (format === "EXCEL") {
      const workbook = createTransactionLedgerSheet(
        ledger, 
        fromDate, 
        toDate, 
        spacesNames,
        isCollaborative,
        openingBalance
      );
      const buffer = await workbook.xlsx.writeBuffer();
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', "Content-Disposition": `attachment; filename="Account Ledger (${fromDate}-${toDate}).xlsx"` });
      res.status(200).send(buffer);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: { message: 'Error creating transaction ledger: ' + errorMessage },
      data: null
    });
  }
});

reportRouter.post('/loan-ledger', authenticate, async (req: Request, res: Response) => {
  try {
    const userId: string = (req as any).user.id;
    const { toDate, space, format } = req.body;

    // Validate input
    if (!toDate || !space || !format) {
      return res.status(400).json({
        success: false,
        error: { message: 'toDate, space, and format are required' },
        data: null
      });
    }

    const spaceInfo = await Space.findById(space);
    if (!spaceInfo) {
      return res.status(404).json({
        success: false,
        error: { message: 'Space not found' },
        data: null
      });
    }

    const loanPrincipal = parseFloat(spaceInfo.loanPrincipal.toString());
    const loanStartDate = spaceInfo.loanStartDate;
    const loanEndDate = spaceInfo.loanEndDate;
    const repaymentPlan = await mongoose.model("LoanRepaymentPlan").findOne({ spaceId: space });
    const interestRate = repaymentPlan ? repaymentPlan.monthlyInterestRate.toString() + "%" : "N/A"; 
    const totalInterest = repaymentPlan ? repaymentPlan.totalInterest.toString() : "N/A";
    const fromDate = loanStartDate;

    // Fetch transactions for the specified spaces and date range
    const transactions = await Transaction.find({
      $and: [
        {
          $or: [
            { from: new ObjectId(space) },
            { to: new ObjectId(space) }
          ]
        },
        { date: { $lte: new Date(toDate) } },
        { userId: new ObjectId(userId) }
      ]
    })
      .populate("to", "name")
      .populate("from", "name")
      .populate("pcategory", "parentCategory subCategories")
      .populate("userId", "username")
      .sort({ date: 1 });

    // Transform transactions into ledger format
    // columns: space, type, date, main category, sub category, amount, remaining balance, cumulative interest, cumulative charges
    let remainingBalance = loanPrincipal; 
    let cumulativeInterest = 0;
    let cumulativeCharges = 0;

    const ledger: any[] = transactions.flatMap(tx => {
      const amount = parseFloat(tx.amount.toString());
      let scategoryName = null;
      if (tx.pcategory && tx.scategory) {
        const sub = (tx.pcategory as any).subCategories.find(
          (subCat: any) => subCat._id.toString() === tx.scategory.toString()
        );
        if (sub) scategoryName = sub.name;
      }

      if (tx.type === TransactionType.LOAN_PRINCIPAL) {
        return []
      }
      else if (tx.type === TransactionType.REPAYMENT_PAID || tx.type === TransactionType.REPAYMENT_RECEIVED) {
        if (scategoryName && scategoryName.toLowerCase().includes("interest")) {
          cumulativeInterest = cumulativeInterest + amount;
        } else {
          remainingBalance = remainingBalance - amount;
        }
      } else if (tx.type === TransactionType.LOAN_CHARGES) {
        cumulativeCharges = cumulativeCharges + amount;
      }

      return [{
        spaceName: spaceInfo.name,
        transactionType: toTitleCase(tx.type),
        date: tx.date.toString().split(" ").splice(1, 3).join(" "),
        mainCategory: (tx.pcategory as any)?.parentCategory || "",
        subCategory: scategoryName ? toTitleCase(scategoryName) : "",
        amount: amount,
        remainingBalance: remainingBalance,
        cumulativeInterest: cumulativeInterest,
        cumulativeCharges: cumulativeCharges
      }];

      
    });

    if (format === "PDF") {
      const html = generateLoanLedgerHTML(
        ledger,
        fromDate ? fromDate.toString().split(" ").splice(1, 3).join(" ") : ledger[0]?.date || "N/A",
        toDate,
        loanPrincipal,
        loanStartDate ? loanStartDate.toString().split(" ").splice(1, 3).join(" ") : "N/A",
        loanEndDate ? loanEndDate.toString().split(" ").splice(1, 3).join(" ") : "N/A",
        interestRate,
        totalInterest
      )

      const pdfBuffer = await getPdfFromHTML(html);

      res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdfBuffer.length, "Content-Disposition": `attachment; filename="Loan Ledger (${fromDate}-${toDate}).pdf"` });
      res.status(200).send(Buffer.from(pdfBuffer));
    } else if (format === "EXCEL") {
      const workbook = createLoanLedgerSheet(
        ledger, 
        fromDate ? fromDate.toString().split(" ").splice(1, 3).join(" ") : ledger[0]?.date || "N/A",
        toDate, 
        loanPrincipal,
        loanStartDate ? loanStartDate.toString().split(" ").splice(1, 3).join(" ") : "N/A",
        loanEndDate ? loanEndDate.toString().split(" ").splice(1, 3).join(" ") : "N/A",
        interestRate,
        totalInterest
      );
      const buffer = await workbook.xlsx.writeBuffer();
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', "Content-Disposition": `attachment; filename="Loan Ledger (${fromDate}-${toDate}).xlsx"` });
      res.status(200).send(buffer);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: { message: 'Error creating transaction ledger: ' + errorMessage },
      data: null
    });
  }
});

reportRouter.post('/credit-card-ledger', authenticate, async (req: Request, res: Response) => {
  try {
    const userId: string = (req as any).user.id;
    const { fromDate, toDate, space, format } = req.body;

    // Validate input
    if (!fromDate || !toDate || !space || !format) {
      return res.status(400).json({
        success: false,
        error: { message: 'fromDate, toDate, space, and format are required' },
        data: null
      });
    }

    const spaceInfo = await Space.findById(space);
    if (!spaceInfo) {
      return res.status(404).json({
        success: false,
        error: { message: 'Space not found' },
        data: null
      });
    }

    const creditLimit = spaceInfo.creditCardLimit;

    // opening balance
    const moneyIn = await Transaction.aggregate([
      {
        $match: {
          userId: {
            $in: [new ObjectId(userId)],
          },
          date: { $lt: new Date(fromDate) },
          type: TransactionType.BALANCE_INCREASE,
          from: new ObjectId(space)
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);
    const moneyOut = await Transaction.aggregate([
      {
        $match: {
          userId: {
            $in: [new ObjectId(userId)],
          },
          date: { $lt: new Date(fromDate) },
          type: TransactionType.BALANCE_DECREASE,
          to: new ObjectId(space)
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);

    console.log(moneyIn?.length, moneyIn[0]?.total)
    console.log(moneyOut?.length, moneyOut[0]?.total)


    const totalMoneyIn = moneyIn[0]?.total || 0;
    const totalMoneyOut = moneyOut[0]?.total || 0;
    const openingBalance = totalMoneyIn - totalMoneyOut;


    // Fetch transactions for the specified spaces and date range
    const transactions = await Transaction.find({
      $and: [
        {
          $or: [
            { from: new ObjectId(space) },
            { to: new ObjectId(space) }
          ]
        },
        { date: { $gte: new Date(fromDate), $lte: new Date(toDate) } },
        { userId: new ObjectId(userId) }
      ]
    })
      .populate("to", "name")
      .populate("from", "name")
      .populate("pcategory", "parentCategory subCategories")
      .populate("userId", "username")
      .sort({ date: 1 });

    let runningBalance = openingBalance;

    // Transform transactions into ledger format
    // columns: space, type, date, main category, sub category, amount, total outstanding
    const ledger: any[] = transactions.flatMap(tx => {
      const amount = parseFloat(tx.amount.toString());
      let scategoryName = null;
      if (tx.pcategory && tx.scategory) {
        const sub = (tx.pcategory as any).subCategories.find(
          (subCat: any) => subCat._id.toString() === tx.scategory.toString()
        );
        if (sub) scategoryName = sub.name;
      }

      if (tx.type === TransactionType.BALANCE_INCREASE) {
        runningBalance += amount; 

        return [{
          spaceName: (tx.from as any)?.name || "",
          transactionType: toTitleCase(tx.type),
          date: tx.date.toString().split(" ").splice(1, 3).join(" "),
          mainCategory: (tx.pcategory as any)?.parentCategory || "",
          subCategory: scategoryName ? toTitleCase(scategoryName) : "",
          amount: amount,
          balance: runningBalance
        }]
      } else if (tx.type === TransactionType.BALANCE_DECREASE) {
        runningBalance -= amount;
        return [{
          spaceName: (tx.to as any)?.name || "",
          transactionType: toTitleCase(tx.type),
          date: tx.date.toString().split(" ").splice(1, 3).join(" "),
          mainCategory: (tx.pcategory as any)?.parentCategory || "",
          subCategory: scategoryName ? toTitleCase(scategoryName) : "",
          amount: amount,
          balance: runningBalance
        }]
      } else {
        return [];
      }
    });

    if (format === "PDF") {
      const html = generateCreditCardLedgerHTML(
        ledger,
        fromDate,
        toDate,
        openingBalance,
        parseFloat(creditLimit.toString())
      )

      const pdfBuffer = await getPdfFromHTML(html);

      res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdfBuffer.length, "Content-Disposition": `attachment; filename="Credit card Ledger (${fromDate}-${toDate}).pdf"` });
      res.status(200).send(Buffer.from(pdfBuffer));
    } else if (format === "EXCEL") {
      const workbook = createCreditCardLedgerSheet(
        ledger, 
        fromDate, 
        toDate, 
        openingBalance,
        parseFloat(creditLimit.toString())
      );
      const buffer = await workbook.xlsx.writeBuffer();
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', "Content-Disposition": `attachment; filename="Credit card Ledger (${fromDate}-${toDate}).xlsx"` });
      res.status(200).send(buffer);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: { message: 'Error creating transaction ledger: ' + errorMessage },
      data: null
    });
  }
});

reportRouter.post('/income-vs-expense', authenticate, async (req: Request, res: Response) => {
  try {
    const userId: string = (req as any).user.id;
    const { fromDate, toDate, spaces, format, isCollaborative } = req.body;
    
    // Validate input
    if (!fromDate || !toDate || !spaces || !Array.isArray(spaces) || spaces.length === 0 || !format || isCollaborative === undefined) {
      return res.status(400).json({ success: false, error: { message: 'Missing required params' } });
    }

    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);

    const transactions = await Transaction.find({
      $and: [
        {
          $or: [
            { from: { $in: spaces.map((id: string) => new ObjectId(id)) } },
            { to: { $in: spaces.map((id: string) => new ObjectId(id)) } }
          ]
        },
        { date: { $gte: new Date(fromDate), $lte: endDate } },
        { userId: spaces.length === 1 && isCollaborative ? { $in: await getUsersBySpace(spaces[0]) } : new ObjectId(userId) }
      ]
    }).populate("pcategory", "parentCategory").populate("to", "name").populate("from", "name");

    let totalIncome = 0;
    let totalExpense = 0;
    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};
    const spacesNames: Set<string> = new Set();
    
    // Also get spaces list for names
    const spacesInfo = await Space.find({ _id: { $in: spaces.map((s: string) => new ObjectId(s)) } });
    spacesInfo.forEach(s => spacesNames.add(s.name));

    transactions.forEach(tx => {
      const amount = parseFloat(tx.amount.toString());
      const cat = (tx as any).pcategory?.parentCategory || "Uncategorized";
      
      if (spaces.includes((tx.to as any)?._id?.toString()) && tx.type === 'INCOME') {
        totalIncome += amount;
        incomeMap[cat] = (incomeMap[cat] || 0) + amount;
      }
      if (spaces.includes((tx.from as any)?._id?.toString()) && tx.type === 'EXPENSE') {
        totalExpense += amount;
        expenseMap[cat] = (expenseMap[cat] || 0) + amount;
      }
    });

    const reportData = {
      totalIncome,
      totalExpense,
      netIncome: totalIncome - totalExpense,
      incomeByCategory: Object.keys(incomeMap).map(k => ({ category: k, amount: incomeMap[k] })),
      expenseByCategory: Object.keys(expenseMap).map(k => ({ category: k, amount: expenseMap[k] }))
    };

    if (format === "PDF") {
      const html = generateIncomeVsExpenseHTML(reportData, fromDate, toDate, Array.from(spacesNames));
      const pdfBuffer = await getPdfFromHTML(html);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdfBuffer.length.toString(), "Content-Disposition": `attachment; filename="Income_vs_Expense_${fromDate}_${toDate}.pdf"` });
      res.status(200).send(Buffer.from(pdfBuffer));
    } else if (format === "EXCEL") {
      const workbook = createIncomeVsExpenseSheet(reportData, fromDate, toDate, Array.from(spacesNames));
      const buffer = await workbook.xlsx.writeBuffer();
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', "Content-Disposition": `attachment; filename="Income_vs_Expense_${fromDate}_${toDate}.xlsx"` });
      res.status(200).send(buffer);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: { message: 'Error: ' + errorMessage }});
  }
});

reportRouter.post('/budget-utilization', authenticate, async (req: Request, res: Response) => {
  try {
    const userId: string = (req as any).user.id;
    const { fromDate, toDate, spaces, format, isCollaborative } = req.body;
    
    // Validate input
    if (!fromDate || !toDate || !spaces || !Array.isArray(spaces) || spaces.length === 0 || !format || isCollaborative === undefined) {
      return res.status(400).json({ success: false, error: { message: 'Missing required params' } });
    }

    const entries = await mongoose.model("BudgetEntry").find({
      spaceIds: { $in: spaces.map((id: string) => new ObjectId(id)) },
      start_date: { $lte: new Date(toDate) },
      end_date: { $gte: new Date(fromDate) }
    }).populate({
      path: "budget_id",
      populate: { path: "mainCategoryId", select: "parentCategory" }
    });

    const spacesNames: Set<string> = new Set();
    const spacesInfo = await Space.find({ _id: { $in: spaces.map((s: string) => new ObjectId(s)) } });
    spacesInfo.forEach(s => spacesNames.add(s.name));

    const budgets = entries.map((entry: any) => {
      const budget = entry.budget_id;
      const cat = budget?.mainCategoryId?.parentCategory || "Uncategorized";
      
      const spaceNamesArr = spacesInfo
        .filter(s => budget?.spaceIds?.map((sid: any) => sid.toString()).includes(s._id.toString()))
        .map(s => s.name);
      const spaceName = spaceNamesArr.length > 0 ? spaceNamesArr.join(", ") : "Unknown";
      
      const allocated = parseFloat(entry.amount.toString());
      const spent = parseFloat(entry.spent.toString());
      const remaining = allocated - spent;
      return {
        spaceName,
        category: cat,
        subCategory: "All", 
        allocated,
        spent,
        remaining,
        utilizationPercentage: allocated > 0 ? (spent / allocated) * 100 : 0
      };
    });

    if (format === "PDF") {
      const html = generateBudgetUtilizationHTML(budgets, fromDate, toDate, Array.from(spacesNames));
      const pdfBuffer = await getPdfFromHTML(html);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdfBuffer.length.toString(), "Content-Disposition": `attachment; filename="Budget_Utilization.pdf"` });
      res.status(200).send(Buffer.from(pdfBuffer));
    } else if (format === "EXCEL") {
      const workbook = createBudgetUtilizationSheet(budgets, fromDate, toDate, Array.from(spacesNames));
      const buffer = await workbook.xlsx.writeBuffer();
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', "Content-Disposition": `attachment; filename="Budget_Utilization.xlsx"` });
      res.status(200).send(buffer);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: { message: 'Error: ' + errorMessage }});
  }
});

reportRouter.post('/loan-repayment-summary', authenticate, async (req: Request, res: Response) => {
  try {
    const userId: string = (req as any).user.id;
    const { toDate, spaces, format } = req.body;
    
    // Validate input
    if (!toDate || !spaces || !Array.isArray(spaces) || spaces.length === 0 || !format) {
      return res.status(400).json({ success: false, error: { message: 'Missing required params' } });
    }

    const plans = await mongoose.model("LoanRepaymentPlan").find({
      spaceId: { $in: spaces.map((id: string) => new ObjectId(id)) }
    }).populate("spaceId");

    const spacesNames: Set<string> = new Set();
    const summaryData = plans.map((plan: any) => {
      spacesNames.add(plan.spaceId?.name || "Unknown");
      const principal = parseFloat(plan.spaceId?.loanPrincipal?.toString() || "0");
      const paid = parseFloat(plan.totalBasePaid?.toString() || "0");
      return {
        spaceName: plan.spaceId?.name || "Unknown",
        totalLoanAmount: principal,
        totalPaidBase: paid,
        remainingPrincipal: principal - paid,
        totalInterestPaid: parseFloat(plan.totalInterestPaid?.toString() || "0"),
        totalChargesPaid: parseFloat(plan.totalChargesPaid?.toString() || "0"),
        monthlyInterestRate: parseFloat(plan.monthlyInterestRate?.toString() || "0")
      };
    });

    if (format === "PDF") {
      const html = generateLoanRepaymentSummaryHTML(summaryData, toDate, Array.from(spacesNames));
      const pdfBuffer = await getPdfFromHTML(html);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdfBuffer.length.toString(), "Content-Disposition": `attachment; filename="Loan_Repayment_Summary.pdf"` });
      res.status(200).send(Buffer.from(pdfBuffer));
    } else if (format === "EXCEL") {
      const workbook = createLoanRepaymentSummarySheet(summaryData, toDate, Array.from(spacesNames));
      const buffer = await workbook.xlsx.writeBuffer();
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', "Content-Disposition": `attachment; filename="Loan_Repayment_Summary.xlsx"` });
      res.status(200).send(buffer);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: { message: 'Error: ' + errorMessage }});
  }
});

reportRouter.post('/statement-of-financial-position', authenticate, async (req: Request, res: Response) => {
  try {
    const userId: string = (req as any).user.id;
    const { toDate, format } = req.body;
    
    if (!toDate || !format) {
      return res.status(400).json({ success: false, error: { message: 'Missing required params' } });
    }

    const tDate = new Date(toDate);
    tDate.setHours(23, 59, 59, 999);

    const spaces = await Space.find({ 
      $or: [
        { users: { $in: [new ObjectId(userId)] } },
        { ownerId: new ObjectId(userId) },
        { userId: new ObjectId(userId) }
      ]
    });
    
    let totalAssets = 0;
    let totalLiabilities = 0;
    const assets: any[] = [];
    const liabilities: any[] = [];

    const transactions = await Transaction.find({
      date: { $lte: tDate },
      $or: [
         { from: { $in: spaces.map(s => s._id) } },
         { to: { $in: spaces.map(s => s._id) } }
      ]
    }).populate("from to");

    const spaceBalances: Record<string, { type: string, name: string, balance: number, loanPrincipal: number }> = {};
    
    spaces.forEach(s => {
      spaceBalances[s._id.toString()] = { 
        type: s.type, 
        name: s.name, 
        balance: 0,
        loanPrincipal: parseFloat((s as any).loanPrincipal?.toString() || "0")
      };
    });

    transactions.forEach(tx => {
      const amount = parseFloat(tx.amount.toString());
      if (tx.to && spaceBalances[(tx.to as any)?._id?.toString()]) {
        spaceBalances[(tx.to as any)?._id?.toString()].balance += amount;
      }
      if (tx.from && spaceBalances[(tx.from as any)?._id?.toString()]) {
        spaceBalances[(tx.from as any)?._id?.toString()].balance -= amount;
      }
    });

    spaces.forEach(s => {
      const balStr = s._id.toString();
      if (!spaceBalances[balStr]) return;
      
      let finalBalance = spaceBalances[balStr].balance;
      const type = spaceBalances[balStr].type;
      
      if (type === 'LOAN') {
         const remaining = spaceBalances[balStr].loanPrincipal - finalBalance;
         liabilities.push({ spaceName: s.name, type, balance: remaining > 0 ? remaining : 0 });
         totalLiabilities += (remaining > 0 ? remaining : 0);
      } else if (type === 'CREDIT_CARD') {
         const outstanding = Math.abs(finalBalance); 
         liabilities.push({ spaceName: s.name, type, balance: finalBalance < 0 ? outstanding : 0 });
         totalLiabilities += (finalBalance < 0 ? outstanding : 0);
         
         if (finalBalance > 0) {
            assets.push({ spaceName: s.name, type, balance: finalBalance });
            totalAssets += finalBalance;
         }
      } else {
         if (finalBalance < 0) {
            liabilities.push({ spaceName: s.name, type, balance: Math.abs(finalBalance) });
            totalLiabilities += Math.abs(finalBalance);
         } else {
            assets.push({ spaceName: s.name, type, balance: finalBalance });
            totalAssets += finalBalance;
         }
      }
    });

    const reportData = {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      assets,
      liabilities
    };

    if (format === "PDF") {
      const html = generateFinancialPositionHTML(reportData, toDate);
      const pdfBuffer = await getPdfFromHTML(html);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdfBuffer.length.toString(), "Content-Disposition": `attachment; filename="Financial_Position.pdf"` });
      res.status(200).send(Buffer.from(pdfBuffer));
    } else if (format === "EXCEL") {
      const workbook = createFinancialPositionSheet(reportData, toDate);
      const buffer = await workbook.xlsx.writeBuffer();
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', "Content-Disposition": `attachment; filename="Financial_Position.xlsx"` });
      res.status(200).send(buffer);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: { message: 'Error: ' + errorMessage }});
  }
});

export default reportRouter;
