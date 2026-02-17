import express, { Request, Response } from 'express';
import Transaction from '../models/transaction';
import { authenticate } from '../middlewares/auth';
import mongoose from 'mongoose';
import { toTitleCase } from '../utils/commonUtil';
import { getUsersBySpace } from './dashboard';
import { generateTransactionLedgerHTML } from '../utils/templateUtil';
import { getPdfFromHTML } from '../utils/pdfUtil';
import { createTransactionLedgerSheet } from '../utils/excelUtil';

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

    console.log("isCollaborative: ", isCollaborative, "spaces: ", spaces, ", ", spaces.length === 1 && isCollaborative);

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

export default reportRouter;
