import LoanInstallment from '../models/loanInstallment';

// Interface for installment object
interface InstallmentData {
    spaceId: string;
    loanRepaymentPlanId: string;
    startDate: Date;
    endDate: Date;
    principalAmount: number;
    interestAmount: number;
    penaltyAmount: number;
    principalPaid: number;
    interestPaid: number;
    penaltyPaid: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL_PAID';
}

interface CalculationParams {
    spaceId: string;
    planId: string;
    loanAmount: number;
    start: Date;
    firstPayment: Date;
    monthsPerInstallment: number;
    monthlyInterestRate: number;
    numberOfInstallments: number;
    installments: InstallmentData[];
}

interface InstallmentCalculationParams {
    spaceId: string;
    planId: string;
    loanAmount: number;
    startDate: string;
    endDate: string;
    firstPaymentDate: string;
    monthsPerInstallment: number;
    monthlyInterestRate: number;
    interestType: string;
}

export async function calculateInstallments(params: InstallmentCalculationParams) {
    const {
        spaceId,
        planId,
        loanAmount,
        startDate,
        endDate,
        firstPaymentDate,
        monthsPerInstallment,
        monthlyInterestRate,
        interestType
    } = params;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const firstPayment = new Date(firstPaymentDate);

    // Calculate total months and number of installments
    const totalMonths = monthsBetween(start, end);
    const numberOfInstallments = Math.ceil(totalMonths / monthsPerInstallment);

    const installments: InstallmentData[] = [];

    // Calculate based on interest type
    switch(interestType) {
        case 'flat':
            await calculateFlatInterest({
                spaceId,
                planId,
                loanAmount,
                start,
                firstPayment,
                monthsPerInstallment,
                monthlyInterestRate,
                numberOfInstallments,
                installments
            });
            break;
            
        case 'reducing':
            await calculateReducingInterest({
                spaceId,
                planId,
                loanAmount,
                start,
                firstPayment,
                monthsPerInstallment,
                monthlyInterestRate,
                numberOfInstallments,
                installments
            });
            break;
            
        case 'emi':
            await calculateEMI({
                spaceId,
                planId,
                loanAmount,
                start,
                firstPayment,
                monthsPerInstallment,
                monthlyInterestRate,
                numberOfInstallments,
                installments
            });
            break;
            
        case 'interest-only':
            await calculateInterestOnly({
                spaceId,
                planId,
                loanAmount,
                start,
                firstPayment,
                monthsPerInstallment,
                monthlyInterestRate,
                numberOfInstallments,
                installments
            });
            break;
            
        default:
            // No interest
            await calculateNoInterest({
                spaceId,
                planId,
                loanAmount,
                start,
                firstPayment,
                monthsPerInstallment,
                numberOfInstallments,
                installments
            });
    }

    // Save all installments to database
    const savedInstallments = await LoanInstallment.insertMany(installments);
    return savedInstallments;
}

function monthsBetween(date1: Date, date2: Date): number {
    const yearDiff = date2.getFullYear() - date1.getFullYear();
    const monthDiff = date2.getMonth() - date1.getMonth();
    return yearDiff * 12 + monthDiff;
}

// Flat interest calculation
async function calculateFlatInterest(params: CalculationParams) {
    const {
        spaceId,
        planId,
        loanAmount,
        start,
        firstPayment,
        monthsPerInstallment,
        monthlyInterestRate,
        numberOfInstallments,
        installments
    } = params;

    const principalPerInstallment = loanAmount / numberOfInstallments;
    const interestPerInstallment = loanAmount * (monthlyInterestRate / 100) * monthsPerInstallment;

    let currentDate = new Date(start);
    let paymentDate = new Date(firstPayment);

    for (let i = 0; i < numberOfInstallments; i++) {
        const startDate = i === 0 ? currentDate : paymentDate;
        const endDate = addMonths(startDate, monthsPerInstallment);

        installments.push({
            spaceId,
            loanRepaymentPlanId: planId,
            startDate: i === 0 ? currentDate : paymentDate,
            endDate,
            principalAmount: principalPerInstallment,
            interestAmount: interestPerInstallment,
            penaltyAmount: 0,
            principalPaid: 0,
            interestPaid: 0,
            penaltyPaid: 0,
            status: 'PENDING'
        });

        paymentDate = endDate;
    }
}

// Reducing interest calculation
async function calculateReducingInterest(params: CalculationParams) {
    const {
        spaceId,
        planId,
        loanAmount,
        start,
        firstPayment,
        monthsPerInstallment,
        monthlyInterestRate,
        numberOfInstallments,
        installments
    } = params;

    const principalPerInstallment = loanAmount / numberOfInstallments;
    let outstandingAmount = loanAmount;

    let currentDate = new Date(start);
    let paymentDate = new Date(firstPayment);

    for (let i = 0; i < numberOfInstallments; i++) {
        const startDate = i === 0 ? currentDate : paymentDate;
        const endDate = addMonths(startDate, monthsPerInstallment);

        const interestAmount = outstandingAmount * (monthlyInterestRate / 100) * monthsPerInstallment;

        installments.push({
            spaceId,
            loanRepaymentPlanId: planId,
            startDate: i === 0 ? currentDate : paymentDate,
            endDate,
            principalAmount: principalPerInstallment,
            interestAmount,
            penaltyAmount: 0,
            principalPaid: 0,
            interestPaid: 0,
            penaltyPaid: 0,
            status: 'PENDING'
        });

        outstandingAmount -= principalPerInstallment;
        paymentDate = endDate;
    }
}

// EMI calculation
async function calculateEMI(params: CalculationParams) {
    const {
        spaceId,
        planId,
        loanAmount,
        start,
        firstPayment,
        monthlyInterestRate,
        numberOfInstallments,
        installments
    } = params;

    // EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
    const r = monthlyInterestRate / 100;
    const n = numberOfInstallments;
    
    const emi = loanAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);

    let outstandingAmount = loanAmount;
    let currentDate = new Date(start);
    let paymentDate = new Date(firstPayment);

    for (let i = 0; i < numberOfInstallments; i++) {
        const startDate = i === 0 ? currentDate : paymentDate;
        const endDate = addMonths(startDate, 1); // EMI always monthly

        const interestAmount = outstandingAmount * r;
        const principalAmount = emi - interestAmount;

        installments.push({
            spaceId,
            loanRepaymentPlanId: planId,
            startDate: i === 0 ? currentDate : paymentDate,
            endDate,
            principalAmount,
            interestAmount,
            penaltyAmount: 0,
            principalPaid: 0,
            interestPaid: 0,
            penaltyPaid: 0,
            status: 'PENDING'
        });

        outstandingAmount -= principalAmount;
        paymentDate = endDate;
    }
}

// Interest only calculation
async function calculateInterestOnly(params: CalculationParams) {
    const {
        spaceId,
        planId,
        loanAmount,
        start,
        firstPayment,
        monthsPerInstallment,
        monthlyInterestRate,
        numberOfInstallments,
        installments
    } = params;

    const interestPerInstallment = loanAmount * (monthlyInterestRate / 100) * monthsPerInstallment;

    let currentDate = new Date(start);
    let paymentDate = new Date(firstPayment);

    for (let i = 0; i < numberOfInstallments; i++) {
        const startDate = i === 0 ? currentDate : paymentDate;
        const endDate = addMonths(startDate, monthsPerInstallment);

        const principalAmount = (i === numberOfInstallments - 1) ? loanAmount : 0;

        installments.push({
            spaceId,
            loanRepaymentPlanId: planId,
            startDate: i === 0 ? currentDate : paymentDate,
            endDate,
            principalAmount,
            interestAmount: interestPerInstallment,
            penaltyAmount: 0,
            principalPaid: 0,
            interestPaid: 0,
            penaltyPaid: 0,
            status: 'PENDING'
        });

        paymentDate = endDate;
    }
}

// No interest calculation
async function calculateNoInterest(params: any) {
    const {
        spaceId,
        planId,
        loanAmount,
        start,
        firstPayment,
        monthsPerInstallment,
        numberOfInstallments,
        installments
    } = params;

    const principalPerInstallment = loanAmount / numberOfInstallments;

    let currentDate = new Date(start);
    let paymentDate = new Date(firstPayment);

    for (let i = 0; i < numberOfInstallments; i++) {
        const startDate = i === 0 ? currentDate : paymentDate;
        const endDate = addMonths(startDate, monthsPerInstallment);

        installments.push({
            spaceId,
            loanRepaymentPlanId: planId,
            startDate: i === 0 ? currentDate : paymentDate,
            endDate,
            principalAmount: principalPerInstallment,
            interestAmount: 0,
            penaltyAmount: 0,
            principalPaid: 0,
            interestPaid: 0,
            penaltyPaid: 0,
            status: 'PENDING'
        });

        paymentDate = endDate;
    }
}

function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    const daysInMonth = result.getDate();
    result.setMonth(result.getMonth() + months);
    
    // Handle edge case where day of month doesn't exist in new month
    if (result.getDate() !== daysInMonth) {
        result.setDate(0); // Set to last day of previous month
    }
    
    return result;
}