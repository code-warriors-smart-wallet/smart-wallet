# Smart Wallet

## Table of contents

-  [Key Features](#key-features)
-  [Tech Stack](#tech-stack)
-  [How to run?](#how-to-run)

## Key Features

- **Multiple Account Types** – Track cash, bank accounts, credit cards, loans (given & borrowed), savings goals, and even collaborative accounts in one place.

- **Smart Dashboards** – Get tailored overviews for each account type, plus a master dashboard showing your assets, liabilities, and net worth at a glance.

- **Category Management** – Organize and tag transactions so you always know where your money goes.

- **Smart Scheduling** – Automate recurring expenses & income (daily, weekly, monthly, yearly, one-t**e) or set reminders.

- **Budgeting Tools** – Set budgets for expense categories in cash, bank, and credit card accounts and keep spending on track.

- **Loan Repayment Plans** – Stay ahead of your loan commitments with structured repayment tracking.

- **Savings Goals** – Create and follow personal saving plans to hit your targets faster.

- **And More…** – Continuous updates with new features to make managing money smarter, simpler, and stress-free.

## Tech Stack

Built with a modern, scalable, and reliable stack:

- **TypeScript** – Strong typing for safer and more maintainable code

- **React** – Dynamic and interactive user interface
 
- **Redux** – Centralized state management for predictable flows
 
- **Tailwind CSS** – Sleek, responsive, and modern styling

- **Node.js** – High-p**formance backend runtime

- **Express.js** – Lightweight, flexible API layer

- **MongoDB** – Fast and scalable NoSQL database

## How to run?

1. Fork the repository to your github account.

2. Clone the repository.
```bash
git clone https://github.com/YOUR_USERNAME/smart-wallet.git
```

3. Create a MongoDB database (MongoDB Atlas) and import the data in the [sample_data](./sample_data) folder.

4. Create `.env` files according to below `.env.example` files and replace `YOUR_SECRET` placeholder with your credentials.
    - [api-gateway/.env.example](api-gateway/.env.example)
    - [user-service/.env.example](user-service/.env.example)
    - [finops-service/.env.example](finops-service/.env.example)
    - [notification-service/.env.example](notification-service/.env.example)
    - [frontend/.env.example](frontend/.env.example)

5. Run below command in the root directory to install dependencies. 
```bash
npm run install-all
```

6. Run below command to start backend.
```bash
npm run start-backend
```

7. Run below command to start frontend.
```bash
npm run start-frontend
```

8. Visit [http://localhost:5173/](http://localhost:5173/) in the browser.