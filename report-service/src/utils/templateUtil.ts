export function generateTransactionLedgerHTML(
    ledger: any[], 
    fromDate: string, 
    toDate: string, 
    isCollaborative: boolean,
    openingBalance: number,
    spacesNames: Set<string>) {
    return `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h2 {
              text-align: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 6px;
              font-size: 12px;
              text-align: right;
            }
            th {
              text-align: left;
              background-color: #f4f4f4;
            }
            td.left {
              text-align: left;
            }
            .total-row {
              font-weight: bold;
              background-color: #eee;
            }
            p {
              font-size: 12px;
            }
            .opening-balance-row {
              font-weight: bold;
              background-color: #d9edf7;
            }
            .final-balance-row {
              font-weight: bold;
              background-color: #dff0d8;
            }
          </style>
        </head>
        <body>
          <h2>Transaction Ledger</h2>
          <p>From: ${fromDate}</p>
          <p>To: ${toDate}</p>
          <p>Spaces: ${Array.from(spacesNames).join(", ")}</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Number of transactions: ${ledger.length - 1}</p>
          <p>Opening Balance: ${openingBalance.toFixed(2)}</p>
          <table>
            <thead>
              <tr>
                <th>Space</th>
                <th>Type</th>
                ${isCollaborative ? '<th>Member</th>' : ''}
                <th>Date</th>
                <th>Category</th>
                <th>SubCategory</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr class="opening-balance-row">
                  <td class="left" colspan="${isCollaborative ? 8 : 7}">OPENING BALANCE</td>
                  <td colspan="3">${openingBalance.toFixed(2)}</td>
              </tr>
              ${ledger.splice(0, ledger.length - 1).map((row: any) => `
                <tr ${row.spaceName === "TOTAL" ? 'class="total-row"' : ""}>
                  <td class="left">${row.spaceName}</td>
                  <td class="left">${row.transactionType}</td>
                  ${isCollaborative ? `<td class="left">${row.username || ""}</td>` : ""}
                  <td class="left">${row.date || ""}</td>
                  <td class="left">${row.mainCategory}</td>
                  <td class="left">${row.subCategory}</td>
                  <td>${row.moneyIn?.toFixed(2) || "0.00"}</td>
                  <td>${row.moneyOut?.toFixed(2) || "0.00"}</td>
                  <td>${row.balance?.toFixed(2) || "0.00"}</td>
                </tr>
              `).join("")}
              <tr class="total-row">
                  <td class="left" colspan="${isCollaborative ? 6 : 5}">FINAL BALANCE</td>
                  <td>${ledger[ledger.length - 1].moneyIn?.toFixed(2) || "0.00"}</td>
                  <td>${ledger[ledger.length - 1].moneyOut?.toFixed(2) || "0.00"}</td>
                  <td>${ledger[ledger.length - 1].balance?.toFixed(2) || "0.00"}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
}