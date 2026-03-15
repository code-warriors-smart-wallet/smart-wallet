// import React, { useState, useEffect } from 'react';
// import Button from '../../../Button';
// import Input from '../../../Input';
// import { getFormattedDate } from '../../../../utils/utils';
// import { LoanRepaymentPlanService } from '../../../../services/loanRepaymentPlan.sevice';
// import { TransactionService } from '../../../../services/transaction.service';
// import { TransactionType } from '../Transactions';
// import { useSelector } from 'react-redux';
// import { RootState } from '../../../../redux/store/store';
// import { toast } from 'react-toastify';

// interface LoanInstallmentsProps {
//     spaceId: string;
//     spaceType: 'LOAN_LENT' | 'LOAN_BORROWED';
//     planId: string;
//     installments: any[];
//     onRefresh: () => void;
// }

// function LoanInstallments({ spaceId, spaceType, planId, installments, onRefresh }: LoanInstallmentsProps) {
//     const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
//     const [paymentModal, setPaymentModal] = useState<{
//         type: 'full' | 'partial' | 'penalty' | 'full-penalty' | 'partial-penalty' | 'remaining';
//         installment: any;
//     } | null>(null);

//     const [principalPaid, setPrincipalPaid] = useState<number>(0);
//     const [interestPaid, setInterestPaid] = useState<number>(0);
//     const [penaltyAmount, setPenaltyAmount] = useState<number>(0);

//     const [page, setPage] = useState<number>(1);
//     const [pageLimit] = useState<number>(10);

//     const { updateInstallment, addPenalty } = LoanRepaymentPlanService();
//     const { createTransaction } = TransactionService();
//     const { spaces, currency } = useSelector((state: RootState) => state.auth);

//     const currentSpace = spaces.find(sp => sp.id === spaceId);

//     useEffect(() => {
//         setPage(1);
//     }, [installments]);

//     // Calculate paginated installments
//     const paginatedInstallments = installments.slice((page - 1) * pageLimit, page * pageLimit);
//     const totalInstallments = installments.length;

//     const handleFullPayment = async (installment: any) => {
//         const remainingPrincipal = installment.principalAmount - installment.principalPaid;
//         const remainingInterest = installment.interestAmount - installment.interestPaid;

//         if (remainingPrincipal <= 0 && remainingInterest <= 0) {
//             toast.info("This installment is already fully paid");
//             return;
//         }

//         setPaymentModal({ type: 'full', installment });
//     };

//     const handlePartialPayment = (installment: any) => {
//         setPaymentModal({ type: 'partial', installment });
//         setPrincipalPaid(0);
//         setInterestPaid(0);
//     };

//     const handleRemainingPayment = (installment: any) => {
//         setPaymentModal({ type: 'remaining', installment });
//     };

//     const handleAddPenalty = (installment: any) => {
//         setPaymentModal({ type: 'penalty', installment });
//         setPenaltyAmount(0);
//     };

//     const handleFullPenalty = (installment: any) => {
//         const remainingPenalty = installment.penaltyAmount - installment.penaltyPaid;
//         if (remainingPenalty <= 0) {
//             toast.info("No penalty remaining to pay");
//             return;
//         }
//         setPaymentModal({ type: 'full-penalty', installment });
//     };

//     const handlePartialPenalty = (installment: any) => {
//         setPaymentModal({ type: 'partial-penalty', installment });
//         setPenaltyAmount(0);
//     };

//     const confirmFullPayment = async () => {
//         if (!paymentModal) return;

//         const installment = paymentModal.installment;
//         const remainingPrincipal = installment.principalAmount - installment.principalPaid;
//         const remainingInterest = installment.interestAmount - installment.interestPaid;

//         try {
//             // Update installment
//             await updateInstallment(installment._id, {
//                 principalPaid: installment.principalPaid + remainingPrincipal,
//                 interestPaid: installment.interestPaid + remainingInterest,
//                 status: 'PAID'
//             });

//             // Create transactions
//             if (remainingPrincipal > 0) {
//                 await createTransaction({
//                     type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
//                     amount: remainingPrincipal,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: `Principal payment for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }
//             if (remainingInterest > 0) {
//                 await createTransaction({
//                     type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
//                     amount: remainingInterest,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: `Interest payment for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }

//             toast.success("Payment recorded successfully");
//             onRefresh();
//             setPaymentModal(null);
//         } catch (error) {
//             console.error("Error processing payment:", error);
//         }
//     };

//     const confirmPartialPayment = async () => {
//         if (!paymentModal) return;

//         const installment = paymentModal.installment;

//         if (principalPaid <= 0 && interestPaid <= 0) {
//             toast.error("Please enter payment amount");
//             return;
//         }

//         if (principalPaid > (installment.principalAmount - installment.principalPaid)) {
//             toast.error("Principal paid exceeds remaining amount");
//             return;
//         }

//         if (interestPaid > (installment.interestAmount - installment.interestPaid)) {
//             toast.error("Interest paid exceeds remaining amount");
//             return;
//         }

//         try {
//             const newPrincipalPaid = installment.principalPaid + principalPaid;
//             const newInterestPaid = installment.interestPaid + interestPaid;

//             let status = installment.status;
//             if (newPrincipalPaid >= installment.principalAmount &&
//                 newInterestPaid >= installment.interestAmount) {
//                 status = 'PAID';
//             } else if (newPrincipalPaid > 0 || newInterestPaid > 0) {
//                 status = 'PARTIAL_PAID';
//             }

//             await updateInstallment(installment._id, {
//                 principalPaid: newPrincipalPaid,
//                 interestPaid: newInterestPaid,
//                 status
//             });

//             // Create transactions
//             if (principalPaid > 0) {
//                 await createTransaction({
//                     type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
//                     amount: principalPaid,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: `Partial principal payment for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }

//             if (interestPaid > 0) {
//                 await createTransaction({
//                     type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
//                     amount: interestPaid,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: `Partial interest payment for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }

//             toast.success("Partial payment recorded successfully");
//             onRefresh();
//             setPaymentModal(null);
//         } catch (error) {
//             console.error("Error processing partial payment:", error);
//         }
//     };

//     const confirmAddPenalty = async () => {
//         if (!paymentModal) return;

//         if (penaltyAmount <= 0) {
//             toast.error("Please enter valid penalty amount");
//             return;
//         }

//         try {
//             await addPenalty(paymentModal.installment._id, penaltyAmount);
//             onRefresh();
//             setPaymentModal(null);
//         } catch (error) {
//             console.error("Error adding penalty:", error);
//         }
//     };

//     const confirmFullPenalty = async () => {
//         if (!paymentModal) return;

//         const installment = paymentModal.installment;
//         const remainingPenalty = installment.penaltyAmount - installment.penaltyPaid;

//         try {
//             await updateInstallment(installment._id, {
//                 penaltyPaid: installment.penaltyPaid + remainingPenalty
//             });

//             await createTransaction({
//                 type: TransactionType.LOAN_CHARGES,
//                 amount: remainingPenalty,
//                 from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                 to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                 date: new Date().toISOString().split('T')[0],
//                 note: `Penalty payment for installment ${getFormattedDate(installment.endDate)}`,
//                 pcategory: null,
//                 scategory: null,
//                 spaceId: spaceId,
//                 loanRepaymentPlanId: planId
//             });

//             toast.success("Penalty paid successfully");
//             onRefresh();
//             setPaymentModal(null);
//         } catch (error) {
//             console.error("Error paying penalty:", error);
//         }
//     };

//     const confirmPartialPenalty = async () => {
//         if (!paymentModal) return;

//         const installment = paymentModal.installment;

//         if (penaltyAmount <= 0) {
//             toast.error("Please enter penalty amount");
//             return;
//         }

//         if (penaltyAmount > (installment.penaltyAmount - installment.penaltyPaid)) {
//             toast.error("Penalty amount exceeds remaining");
//             return;
//         }

//         try {
//             await updateInstallment(installment._id, {
//                 penaltyPaid: installment.penaltyPaid + penaltyAmount
//             });

//             await createTransaction({
//                 type: TransactionType.LOAN_CHARGES,
//                 amount: penaltyAmount,
//                 from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                 to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                 date: new Date().toISOString().split('T')[0],
//                 note: `Partial penalty payment for installment ${getFormattedDate(installment.endDate)}`,
//                 pcategory: null,
//                 scategory: null,
//                 spaceId: spaceId,
//                 loanRepaymentPlanId: planId
//             });

//             toast.success("Partial penalty paid successfully");
//             onRefresh();
//             setPaymentModal(null);
//         } catch (error) {
//             console.error("Error paying partial penalty:", error);
//         }
//     };

//     const confirmRemainingPayment = async () => {
//         if (!paymentModal) return;

//         const installment = paymentModal.installment;
//         const remainingPrincipal = installment.principalAmount - installment.principalPaid;
//         const remainingInterest = installment.interestAmount - installment.interestPaid;

//         try {
//             await updateInstallment(installment._id, {
//                 principalPaid: installment.principalAmount,
//                 interestPaid: installment.interestAmount,
//                 status: 'PAID'
//             });

//             if (remainingPrincipal > 0) {
//                 await createTransaction({
//                     type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
//                     amount: remainingPrincipal,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: `Remaining principal payment for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }

//             if (remainingInterest > 0) {
//                 await createTransaction({
//                     type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
//                     amount: remainingInterest,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: `Remaining interest payment for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }

//             toast.success("Remaining balance paid successfully");
//             onRefresh();
//             setPaymentModal(null);
//         } catch (error) {
//             console.error("Error paying remaining balance:", error);
//         }
//     };

//     const getStatusBadge = (status: string) => {
//         switch (status) {
//             case 'PAID':
//                 return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">PAID</span>;
//             case 'PARTIAL_PAID':
//                 return <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">PARTIAL</span>;
//             case 'OVERDUE':
//                 return <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">OVERDUE</span>;
//             default:
//                 return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">PENDING</span>;
//         }
//     };

//     return (
//         <div className="mt-5">
//             <h2 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-3">
//                 Installments
//             </h2>

//             <div className="overflow-x-auto">
//                 <table className="w-full border-collapse">
//                     <thead>
//                         <tr className="bg-gray-100 dark:bg-gray-800">
//                             <th className="p-2 text-left text-sm text-white">Period</th>
//                             <th className="p-2 text-left text-sm text-white">Due Date</th>
//                             <th className="p-2 text-right text-sm text-white">Principal</th>
//                             <th className="p-2 text-right text-sm text-white">Interest</th>
//                             <th className="p-2 text-right text-sm text-white">Penalty</th>
//                             <th className="p-2 text-right text-sm text-white">Paid</th>
//                             <th className="p-2 text-center text-sm text-white">Status</th>
//                             <th className="p-2 text-center text-sm  text-white">Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {paginatedInstallments.map((inst, index) => {

//                             const absoluteIndex = (page - 1) * pageLimit + index;

//                             const isOverdue = new Date(inst.endDate) < new Date() && inst.status !== 'PAID';
//                             const remainingPrincipal = inst.principalAmount - inst.principalPaid;
//                             const remainingInterest = inst.interestAmount - inst.interestPaid;
//                             const remainingPenalty = inst.penaltyAmount - inst.penaltyPaid;
//                             const isPartiallyPaid = inst.principalPaid > 0 || inst.interestPaid > 0;

//                             return (
//                                 <tr
//                                     key={inst._id}
//                                     className={`border-b border-border-light-primary dark:border-border-dark-primary hover:bg-hover-light-primary dark:hover:bg-hover-dark-primary
//                                         ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
//                                 >
//                                     <td className="p-2 text-sm text-white">{absoluteIndex + 1}</td>
//                                     <td className="p-2 text-sm text-white">{getFormattedDate(inst.endDate)}</td>
//                                     <td className="p-2 text-right text-sm text-white">{inst.principalAmount} {currency}</td>
//                                     <td className="p-2 text-right text-sm text-white">{inst.interestAmount} {currency}</td>
//                                     <td className="p-2 text-right text-sm text-white">{inst.penaltyAmount} {currency}</td>
//                                     <td className="p-2 text-right text-sm text-white">
//                                         {inst.principalPaid + inst.interestPaid + inst.penaltyPaid} {currency}
//                                     </td>
//                                     <td className="p-2 text-center">
//                                         {getStatusBadge(isOverdue ? 'OVERDUE' : inst.status)}
//                                     </td>
//                                     <td className="p-2">
//                                         <div className="flex gap-1 flex-wrap justify-center">
//                                             {inst.status !== 'PAID' && (
//                                                 <>
//                                                     {/* Full payment button */}
//                                                     {(remainingPrincipal > 0 || remainingInterest > 0) && (
//                                                         <Button
//                                                             text="Full"
//                                                             className="max-w-fit text-xs py-1 px-2"
//                                                             onClick={() => handleFullPayment(inst)}
//                                                         />
//                                                     )}

//                                                     {/* Partial payment button */}
//                                                     {(remainingPrincipal > 0 || remainingInterest > 0) && (
//                                                         <Button
//                                                             text="Partial"
//                                                             className="max-w-fit text-xs py-1 px-2"
//                                                             priority="secondary"
//                                                             onClick={() => handlePartialPayment(inst)}
//                                                         />
//                                                     )}

//                                                     {/* Remaining balance button (for partially paid) */}
//                                                     {isPartiallyPaid && (remainingPrincipal > 0 || remainingInterest > 0) && (
//                                                         <Button
//                                                             text="Remaining"
//                                                             className="max-w-fit text-xs py-1 px-2 bg-blue-500 hover:bg-blue-600"
//                                                             onClick={() => handleRemainingPayment(inst)}
//                                                         />
//                                                     )}

//                                                     {/* Penalty buttons */}
//                                                     <Button
//                                                         text="Add Penalty"
//                                                         className="max-w-fit text-xs py-1 px-2 bg-red-500 hover:bg-red-600"
//                                                         onClick={() => handleAddPenalty(inst)}
//                                                     />

//                                                     {inst.penaltyAmount > 0 && remainingPenalty > 0 && (
//                                                         <>
//                                                             <Button
//                                                                 text="Pay Penalty"
//                                                                 className="max-w-fit text-xs py-1 px-2 bg-orange-500 hover:bg-orange-600"
//                                                                 onClick={() => handleFullPenalty(inst)}
//                                                             />
//                                                             <Button
//                                                                 text="Pay Partial Penalty"
//                                                                 className="max-w-fit text-xs py-1 px-2 bg-orange-400 hover:bg-orange-500"
//                                                                 priority="secondary"
//                                                                 onClick={() => handlePartialPenalty(inst)}
//                                                             />
//                                                         </>
//                                                     )}
//                                                 </>
//                                             )}
//                                         </div>
//                                     </td>
//                                 </tr>
//                             );
//                         })}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Pagination Controls */}
//             {totalInstallments > 0 && (
//                 <div className="flex justify-center items-center gap-2 mt-4">
//                     <Button
//                         text={`${(page - 1) * pageLimit + 1}-${Math.min((page - 1) * pageLimit + paginatedInstallments.length, totalInstallments)} of ${totalInstallments}`}
//                         className="max-w-fit bg-transparent pointer-events-none text-text-light-primary dark:text-text-dark-primary"
//                         onClick={() => {}}
//                     />
//                     <Button
//                         text="Prev"
//                         className="max-w-fit bg-transparent border border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary"
//                         onClick={() => setPage(prev => prev - 1)}
//                         disabled={page === 1}
//                     />
//                     <Button
//                         text="Next"
//                         className="max-w-fit bg-transparent border border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary"
//                         onClick={() => setPage(prev => prev + 1)}
//                         disabled={page * pageLimit >= totalInstallments}
//                     />
//                 </div>
//             )}

//             {/* Payment Modals */}
//             {paymentModal && (
//                 <div className="fixed top-0 left-0 w-screen h-screen z-[1000] grid place-items-center bg-opacity-50 modal-bg">
//                     <div className="w-full max-w-md bg-bg-light-secondary dark:bg-bg-dark-secondary rounded-lg p-4">
//                         <h3 className="text-lg font-bold mb-3 text-white">
//                             {paymentModal.type === 'full' && 'Confirm Full Payment'}
//                             {paymentModal.type === 'partial' && 'Partial Payment'}
//                             {paymentModal.type === 'penalty' && 'Add Penalty'}
//                             {paymentModal.type === 'full-penalty' && 'Pay Full Penalty'}
//                             {paymentModal.type === 'partial-penalty' && 'Pay Partial Penalty'}
//                             {paymentModal.type === 'remaining' && 'Pay Remaining Balance'}
//                         </h3>

//                         {(paymentModal.type === 'partial' || paymentModal.type === 'remaining') && (
//                             <div className="space-y-3">
//                                 <div>
//                                     <label className="text-sm text-white">Principal Amount (Max: {paymentModal.installment.principalAmount - paymentModal.installment.principalPaid} {currency})</label>
//                                     <Input
//                                         name="principalAmount"
//                                         type="number"
//                                         placeholder="Enter principal amount"
//                                         value={principalPaid.toString()}
//                                         onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrincipalPaid(parseFloat(e.target.value) || 0)}
//                                         className="mt-1"
//                                         max={(paymentModal.installment.principalAmount - paymentModal.installment.principalPaid).toString()}
//                                         min="0"
//                                         step="0.01"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="text-sm text-white">Interest Amount (Max: {paymentModal.installment.interestAmount - paymentModal.installment.interestPaid} {currency})</label>
//                                     <Input
//                                         name="interestAmount"
//                                         type="number"
//                                         placeholder="Enter interest amount"
//                                         value={interestPaid.toString()}
//                                         onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInterestPaid(parseFloat(e.target.value) || 0)}
//                                         className="mt-1"
//                                         max={(paymentModal.installment.interestAmount - paymentModal.installment.interestPaid).toString()}
//                                         min="0"
//                                         step="0.01"
//                                     />
//                                 </div>
//                             </div>
//                         )}

//                         {(paymentModal.type === 'penalty' || paymentModal.type === 'partial-penalty') && (
//                             <div>
//                                 <label className="text-sm text-white">Penalty Amount</label>
//                                 <Input
//                                     name="penaltyAmount"
//                                     type="number"
//                                     placeholder="Enter penalty amount"
//                                     value={penaltyAmount.toString()}
//                                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPenaltyAmount(parseFloat(e.target.value) || 0)}
//                                     className="mt-1"
//                                     max={paymentModal.type === 'partial-penalty' ?
//                                         (paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid).toString() :
//                                         undefined}
//                                     min="0"
//                                     step="0.01"
//                                 />
//                             </div>
//                         )}

//                         {(paymentModal.type === 'full' || paymentModal.type === 'full-penalty' || paymentModal.type === 'remaining') && (
//                             <p className="text-sm text-yellow-600 dark:text-yellow-400">
//                                 {paymentModal.type === 'full' && `You are about to pay full amount: ${paymentModal.installment.principalAmount - paymentModal.installment.principalPaid + paymentModal.installment.interestAmount - paymentModal.installment.interestPaid} ${currency}`}
//                                 {paymentModal.type === 'full-penalty' && `You are about to pay full penalty: ${paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid} ${currency}`}
//                                 {paymentModal.type === 'remaining' && `You are about to pay remaining balance: ${paymentModal.installment.principalAmount - paymentModal.installment.principalPaid + paymentModal.installment.interestAmount - paymentModal.installment.interestPaid} ${currency}`}
//                             </p>
//                         )}

//                         <div className="flex justify-end gap-2 mt-4">
//                             <Button
//                                 text="Cancel"
//                                 priority="secondary"
//                                 onClick={() => setPaymentModal(null)}
//                             />
//                             <Button
//                                 text="Confirm"
//                                 onClick={
//                                     paymentModal.type === 'full' ? confirmFullPayment :
//                                         paymentModal.type === 'partial' ? confirmPartialPayment :
//                                             paymentModal.type === 'penalty' ? confirmAddPenalty :
//                                                 paymentModal.type === 'full-penalty' ? confirmFullPenalty :
//                                                     paymentModal.type === 'partial-penalty' ? confirmPartialPenalty :
//                                                         confirmRemainingPayment
//                                 }
//                             />
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// export default LoanInstallments;

/**********************************************************************************************************************************************************/

/**********************************************************************************************************************************************************/

/**********************************************************************************************************************************************************/

// import React, { useState, useEffect } from 'react';
// import Button from '../../../Button';
// import Input from '../../../Input';
// import { getFormattedDate } from '../../../../utils/utils';
// import { LoanRepaymentPlanService } from '../../../../services/loanRepaymentPlan.sevice';
// import { TransactionService } from '../../../../services/transaction.service';
// import { CategoryService } from '../../../../services/category.service';
// import { TransactionType } from '../Transactions';
// import { useSelector } from 'react-redux';
// import { RootState } from '../../../../redux/store/store';
// import { toast } from 'react-toastify';

// interface LoanInstallmentsProps {
//     spaceId: string;
//     spaceType: 'LOAN_LENT' | 'LOAN_BORROWED';
//     planId: string;
//     installments: any[];
//     onRefresh: () => void;
// }

// function LoanInstallments({ spaceId, spaceType, planId, installments, onRefresh }: LoanInstallmentsProps) {
//     const [paymentModal, setPaymentModal] = useState<{
//         type: 'full' | 'partial' | 'penalty' | 'remaining' | 'edit-penalty';
//         installment: any;
//     } | null>(null);

//     const [principalPaid, setPrincipalPaid] = useState<number>(0);
//     const [interestPaid, setInterestPaid] = useState<number>(0);
//     const [penaltyAmount, setPenaltyAmount] = useState<number>(0);
//     const [penaltyPaid, setPenaltyPaid] = useState<number>(0);

//     const [page, setPage] = useState<number>(1);
//     const [pageLimit] = useState<number>(10);

//     const { updateInstallment, updateInstallmentPenalty } = LoanRepaymentPlanService();
//     const { createTransaction } = TransactionService();
//     const { currency } = useSelector((state: RootState) => state.auth);

//     useEffect(() => {
//         setPage(1);
//     }, [installments]);

//     // Calculate paginated installments
//     const paginatedInstallments = installments.slice((page - 1) * pageLimit, page * pageLimit);
//     const totalInstallments = installments.length;

//     const handleFullPayment = async (installment: any) => {
//         const remainingPrincipal = installment.principalAmount - installment.principalPaid;
//         const remainingInterest = installment.interestAmount - installment.interestPaid;
//         const remainingPenalty = installment.penaltyAmount - installment.penaltyPaid;

//         if (remainingPrincipal <= 0 && remainingInterest <= 0 && remainingPenalty <= 0) {
//             toast.info("This installment is already fully paid");
//             return;
//         }

//         setPaymentModal({ type: 'full', installment });
//     };

//     const handlePartialPayment = (installment: any) => {
//         setPaymentModal({ type: 'partial', installment });
//         setPrincipalPaid(0);
//         setInterestPaid(0);
//         setPenaltyPaid(0);
//     };

//     const handleRemainingPayment = (installment: any) => {
//         setPaymentModal({ type: 'remaining', installment });
//         setPrincipalPaid(installment.principalAmount - installment.principalPaid);
//         setInterestPaid(installment.interestAmount - installment.interestPaid);
//         setPenaltyPaid(installment.penaltyAmount - installment.penaltyPaid);
//     };

//     const handleAddPenalty = (installment: any) => {
//         setPaymentModal({ type: 'penalty', installment });
//         setPenaltyAmount(0);
//     };

//     const handleEditPenalty = (installment: any) => {
//         setPaymentModal({ type: 'edit-penalty', installment });
//         setPenaltyAmount(installment.penaltyAmount);
//     };

//     const confirmFullPayment = async () => {
//         if (!paymentModal) return;

//         const installment = paymentModal.installment;
//         const remainingPrincipal = installment.principalAmount - installment.principalPaid;
//         const remainingInterest = installment.interestAmount - installment.interestPaid;
//         const remainingPenalty = installment.penaltyAmount - installment.penaltyPaid;

//         const totalAmount = remainingPrincipal + remainingInterest + remainingPenalty;

//         try {
//             // Update installment
//             await updateInstallment(installment._id, {
//                 principalPaid: installment.principalPaid + remainingPrincipal,
//                 interestPaid: installment.interestPaid + remainingInterest,
//                 penaltyPaid: installment.penaltyPaid + remainingPenalty,
//                 status: 'PAID'
//             });

//             // Create transactions
//             if (remainingPrincipal > 0) {
//                 await createTransaction({
//                     type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
//                     amount: remainingPrincipal,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: spaceType === 'LOAN_LENT'
//                         ? `Principal received for installment ${getFormattedDate(installment.endDate)}`
//                         : `Principal paid for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }
//             if (remainingInterest > 0) {
//                 await createTransaction({
//                     type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
//                     amount: remainingInterest,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: spaceType === 'LOAN_LENT'
//                         ? `Interest received for installment ${getFormattedDate(installment.endDate)}`
//                         : `Interest paid for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }
//             if (remainingPenalty > 0) {
//                 await createTransaction({
//                     type: TransactionType.LOAN_CHARGES,
//                     amount: remainingPenalty,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: spaceType === 'LOAN_LENT'
//                         ? `Penalty received for installment ${getFormattedDate(installment.endDate)}`
//                         : `Penalty paid for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }

//             toast.success(
//                 spaceType === 'LOAN_LENT'
//                     ? `Full collection of ${totalAmount} ${currency} recorded successfully`
//                     : `Full payment of ${totalAmount} ${currency} recorded successfully`
//             );
//             onRefresh();
//             setPaymentModal(null);
//         } catch (error) {
//             console.error("Error processing payment:", error);
//             toast.error(
//                 spaceType === 'LOAN_LENT'
//                     ? "Failed to process full collection"
//                     : "Failed to process full payment"
//             );
//         }
//     };

//     const confirmPartialPayment = async () => {
//         if (!paymentModal) return;

//         const installment = paymentModal.installment;

//         if (principalPaid <= 0 && interestPaid <= 0 && penaltyPaid <= 0) {
//             toast.error("Please enter payment amount");
//             return;
//         }

//         if (principalPaid > (installment.principalAmount - installment.principalPaid)) {
//             toast.error("Principal paid exceeds remaining amount");
//             return;
//         }

//         if (interestPaid > (installment.interestAmount - installment.interestPaid)) {
//             toast.error("Interest paid exceeds remaining amount");
//             return;
//         }

//         if (penaltyPaid > (installment.penaltyAmount - installment.penaltyPaid)) {
//             toast.error("Penalty paid exceeds remaining amount");
//             return;
//         }

//         try {
//             const newPrincipalPaid = installment.principalPaid + principalPaid;
//             const newInterestPaid = installment.interestPaid + interestPaid;
//             const newPenaltyPaid = installment.penaltyPaid + penaltyPaid;

//             let status = installment.status;
//             if (newPrincipalPaid >= installment.principalAmount &&
//                 newInterestPaid >= installment.interestAmount &&
//                 newPenaltyPaid >= installment.penaltyAmount) {
//                 status = 'PAID';
//             } else if (newPrincipalPaid > 0 || newInterestPaid > 0 || newPenaltyPaid > 0) {
//                 status = 'PARTIAL_PAID';
//             }

//             await updateInstallment(installment._id, {
//                 principalPaid: newPrincipalPaid,
//                 interestPaid: newInterestPaid,
//                 penaltyPaid: newPenaltyPaid,
//                 status
//             });

//             // Create transactions
//             if (principalPaid > 0) {
//                 await createTransaction({
//                     type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
//                     amount: principalPaid,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: spaceType === 'LOAN_LENT'
//                         ? `Partial principal received for installment ${getFormattedDate(installment.endDate)}`
//                         : `Partial principal paid for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }

//             if (interestPaid > 0) {
//                 await createTransaction({
//                     type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
//                     amount: interestPaid,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: spaceType === 'LOAN_LENT'
//                         ? `Partial interest received for installment ${getFormattedDate(installment.endDate)}`
//                         : `Partial interest paid for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }

//             if (penaltyPaid > 0) {
//                 await createTransaction({
//                     type: TransactionType.LOAN_CHARGES,
//                     amount: penaltyPaid,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: spaceType === 'LOAN_LENT'
//                         ? `Partial penalty received for installment ${getFormattedDate(installment.endDate)}`
//                         : `Partial penalty paid for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }
//             toast.success(
//                 spaceType === 'LOAN_LENT'
//                     ? "Partial collection recorded successfully"
//                     : "Partial payment recorded successfully"
//             );
//             onRefresh();
//             setPaymentModal(null);
//         } catch (error) {
//             console.error("Error processing partial payment:", error);
//             toast.error(
//                 spaceType === 'LOAN_LENT'
//                     ? "Failed to process partial collection"
//                     : "Failed to process partial payment"
//             );
//         }
//     };

//     const confirmAddPenalty = async () => {
//         if (!paymentModal) return;

//         if (penaltyAmount <= 0) {
//             toast.error("Please enter valid penalty amount");
//             return;
//         }

//         try {
//             const installment = paymentModal.installment;

//             if (paymentModal.type === 'edit-penalty') {
//                 // For edit, we need to update the penalty amount
//                 await updateInstallmentPenalty(installment._id, penaltyAmount);
//                 toast.success("Penalty updated successfully!");
//             } else {
//                 // For add, we add to existing penalty
//                 await updateInstallmentPenalty(installment._id, (installment.penaltyAmount || 0) + penaltyAmount);
//                 toast.success("Penalty added successfully!");
//             }

//             onRefresh(); // Refresh data to reflect penalty changes
//             setPaymentModal(null);
//             setPenaltyAmount(0);
//         } catch (error) {
//             console.error("Error processing penalty:", error);
//             toast.error("Failed to process penalty");
//         }
//     };

//     const confirmRemainingPayment = async () => {
//         if (!paymentModal) return;

//         const installment = paymentModal.installment;
//         const remainingPrincipal = installment.principalAmount - installment.principalPaid;
//         const remainingInterest = installment.interestAmount - installment.interestPaid;
//         const remainingPenalty = installment.penaltyAmount - installment.penaltyPaid;


//         try {
//             await updateInstallment(installment._id, {
//                 principalPaid: installment.principalAmount,
//                 interestPaid: installment.interestAmount,
//                 penaltyPaid: installment.penaltyAmount,
//                 status: 'PAID'
//             });

//             if (remainingPrincipal > 0) {
//                 await createTransaction({
//                     type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
//                     amount: remainingPrincipal,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: spaceType === 'LOAN_LENT'
//                         ? `Remaining principal received for installment ${getFormattedDate(installment.endDate)}`
//                         : `Remaining principal paid for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }

//             if (remainingInterest > 0) {
//                 await createTransaction({
//                     type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
//                     amount: remainingInterest,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: spaceType === 'LOAN_LENT'
//                         ? `Remaining interest received for installment ${getFormattedDate(installment.endDate)}`
//                         : `Remaining interest paid for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }

//             if (remainingPenalty > 0) {
//                 await createTransaction({
//                     type: TransactionType.LOAN_CHARGES,
//                     amount: remainingPenalty,
//                     from: spaceType === 'LOAN_LENT' ? spaceId : null,
//                     to: spaceType === 'LOAN_LENT' ? null : spaceId,
//                     date: new Date().toISOString().split('T')[0],
//                     note: spaceType === 'LOAN_LENT'
//                         ? `Remaining penalty received for installment ${getFormattedDate(installment.endDate)}`
//                         : `Remaining penalty paid for installment ${getFormattedDate(installment.endDate)}`,
//                     pcategory: null,
//                     scategory: null,
//                     spaceId: spaceId,
//                     loanRepaymentPlanId: planId
//                 });
//             }

//             toast.success(
//                 spaceType === 'LOAN_LENT'
//                     ? `Remaining balance collected successfully`
//                     : `Remaining balance paid successfully`
//             );
//             onRefresh();
//             setPaymentModal(null);
//         } catch (error) {
//             console.error("Error paying remaining balance:", error);
//             toast.error(
//                 spaceType === 'LOAN_LENT'
//                     ? "Failed to collect remaining balance"
//                     : "Failed to pay remaining balance"
//             );
//         }
//     };

//     const getStatusBadge = (status: string) => {
//         switch (status) {
//             case 'PAID':
//                 return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">PAID</span>;
//             case 'PARTIAL_PAID':
//                 return <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">PARTIAL</span>;
//             case 'OVERDUE':
//                 return <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">OVERDUE</span>;
//             default:
//                 return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">PENDING</span>;
//         }
//     };

//     return (
//         <div className="mt-5">
//             <h2 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-3">
//                 Installments
//             </h2>

//             <div className="overflow-x-auto">
//                 <table className="w-full border-collapse">
//                     <thead>
//                         <tr className="bg-gray-100 dark:bg-gray-800">
//                             <th className="p-2 text-left text-sm text-white">Period</th>
//                             <th className="p-2 text-left text-sm text-white">Due Date</th>
//                             <th className="p-2 text-right text-sm text-white">Principal</th>
//                             <th className="p-2 text-right text-sm text-white">Interest</th>
//                             <th className="p-2 text-right text-sm text-white">Penalty</th>
//                             <th className="p-2 text-right text-sm text-white">Paid</th>
//                             <th className="p-2 text-center text-sm text-white">Status</th>
//                             <th className="p-2 text-center text-sm  text-white">Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {paginatedInstallments.map((inst, index) => {

//                             const absoluteIndex = (page - 1) * pageLimit + index;

//                             const isOverdue = new Date(inst.endDate) < new Date() && inst.status !== 'PAID';
//                             const remainingPrincipal = inst.principalAmount - inst.principalPaid;
//                             const remainingInterest = inst.interestAmount - inst.interestPaid;
//                             const remainingPenalty = inst.penaltyAmount - inst.penaltyPaid;
//                             const isPartiallyPaid = inst.principalPaid > 0 || inst.interestPaid > 0 || inst.penaltyPaid > 0;

//                             const hasPenalty = inst.penaltyAmount > 0;

//                             return (
//                                 <tr
//                                     key={inst._id}
//                                     className={`border-b border-border-light-primary dark:border-border-dark-primary hover:bg-hover-light-primary dark:hover:bg-hover-dark-primary
//                                         ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
//                                 >
//                                     <td className="p-2 text-sm text-white">{absoluteIndex + 1}</td>
//                                     <td className="p-2 text-sm text-white">{getFormattedDate(inst.endDate)}</td>
//                                     <td className="p-2 text-right text-sm text-white">{inst.principalAmount} {currency}</td>
//                                     <td className="p-2 text-right text-sm text-white">{inst.interestAmount} {currency}</td>
//                                     <td className="p-2 text-right text-sm text-white">{inst.penaltyAmount} {currency}</td>
//                                     <td className="p-2 text-right text-sm text-white">
//                                         {inst.principalPaid + inst.interestPaid + inst.penaltyPaid} {currency}
//                                     </td>
//                                     <td className="p-2 text-center">
//                                         {getStatusBadge(isOverdue ? 'OVERDUE' : inst.status)}
//                                     </td>
//                                     <td className="p-2">
//                                         <div className="flex gap-1 flex-wrap justify-center">
//                                             {inst.status !== 'PAID' && (
//                                                 <>
//                                                     {/* Full payment button */}
//                                                     {(remainingPrincipal > 0 || remainingInterest > 0) && (
//                                                         <Button
//                                                             text="Full"
//                                                             className="max-w-fit text-xs py-1 px-2"
//                                                             onClick={() => handleFullPayment(inst)}
//                                                         />
//                                                     )}

//                                                     {/* Show Partial button only if NOT partially paid */}
//                                                     {(remainingPrincipal > 0 || remainingInterest > 0 || remainingPenalty > 0) && (
//                                                         <Button
//                                                             text="Partial"
//                                                             className="max-w-fit text-xs py-1 px-2"
//                                                             priority="secondary"
//                                                             onClick={() => handlePartialPayment(inst)}
//                                                         />
//                                                     )}

//                                                     {/* Show Remaining button if partially paid AND any amount remaining */}
//                                                     {isPartiallyPaid && (remainingPrincipal > 0 || remainingInterest > 0 || remainingPenalty > 0) && (
//                                                         <Button
//                                                             text="Remaining"
//                                                             className="max-w-fit text-xs py-1 px-2 bg-blue-500 hover:bg-blue-600"
//                                                             onClick={() => handleRemainingPayment(inst)}
//                                                         />
//                                                     )}

//                                                     {/* Penalty button - Show Edit Penalty if penalty exists, otherwise Add Penalty */}
//                                                     {hasPenalty ? (
//                                                         <Button
//                                                             text="Edit Penalty"
//                                                             className="max-w-fit text-xs py-1 px-2 bg-orange-500 hover:bg-orange-600"
//                                                             onClick={() => handleEditPenalty(inst)}
//                                                         />
//                                                     ) : (
//                                                         <Button
//                                                             text="Add Penalty"
//                                                             className="max-w-fit text-xs py-1 px-2 bg-red-500 hover:bg-red-600"
//                                                             onClick={() => handleAddPenalty(inst)}
//                                                         />
//                                                     )}
//                                                 </>
//                                             )}
//                                         </div>
//                                     </td>
//                                 </tr>
//                             );
//                         })}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Pagination Controls */}
//             {totalInstallments > 0 && (
//                 <div className="flex justify-center items-center gap-2 mt-4">
//                     <Button
//                         text={`${(page - 1) * pageLimit + 1}-${Math.min((page - 1) * pageLimit + paginatedInstallments.length, totalInstallments)} of ${totalInstallments}`}
//                         className="max-w-fit bg-transparent pointer-events-none text-text-light-primary dark:text-text-dark-primary"
//                         onClick={() => { }}
//                     />
//                     <Button
//                         text="Prev"
//                         className="max-w-fit bg-transparent border border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary"
//                         onClick={() => setPage(prev => prev - 1)}
//                         disabled={page === 1}
//                     />
//                     <Button
//                         text="Next"
//                         className="max-w-fit bg-transparent border border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary"
//                         onClick={() => setPage(prev => prev + 1)}
//                         disabled={page * pageLimit >= totalInstallments}
//                     />
//                 </div>
//             )}

//             {/* Payment Modals */}
//             {paymentModal && (
//                 <div className="fixed top-0 left-0 w-screen h-screen z-[1000] grid place-items-center bg-opacity-50 modal-bg">
//                     <div className="w-full max-w-md bg-bg-light-secondary dark:bg-bg-dark-secondary rounded-lg p-4">
//                         <h3 className="text-lg font-bold mb-3 text-white">
//                             {paymentModal.type === 'full' && (
//                                 spaceType === 'LOAN_BORROWED' ? 'Confirm Full Payment' : 'Confirm Full Collection'
//                             )}
//                             {paymentModal.type === 'partial' && (
//                                 spaceType === 'LOAN_BORROWED' ? 'Partial Payment' : 'Partial Collection'
//                             )}
//                             {paymentModal.type === 'penalty' && 'Add Penalty'}
//                             {paymentModal.type === 'edit-penalty' && 'Edit Penalty'}
//                             {paymentModal.type === 'remaining' && (
//                                 spaceType === 'LOAN_BORROWED' ? 'Pay Remaining Balance' : 'Receive Remaining Balance'
//                             )}
//                         </h3>

//                         {(paymentModal.type === 'partial' || paymentModal.type === 'remaining') && (
//                             <div className="space-y-3">
//                                 <div>
//                                     <label className="text-sm text-white">Principal Amount (Max: {paymentModal.installment.principalAmount - paymentModal.installment.principalPaid} {currency})</label>
//                                     <Input
//                                         name="principalAmount"
//                                         type="number"
//                                         placeholder="Enter principal amount"
//                                         value={principalPaid.toString()}
//                                         onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrincipalPaid(parseFloat(e.target.value) || 0)}
//                                         className={`mt-1 ${paymentModal.installment.principalPaid >= paymentModal.installment.principalAmount ? 'cursor-not-allowed opacity-50' : ''}`}
//                                         max={(paymentModal.installment.principalAmount - paymentModal.installment.principalPaid).toString()}
//                                         min="0"
//                                         step="0.01"
//                                         disabled={paymentModal.installment.principalPaid >= paymentModal.installment.principalAmount}
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="text-sm text-white">Interest Amount (Max: {paymentModal.installment.interestAmount - paymentModal.installment.interestPaid} {currency})</label>
//                                     <Input
//                                         name="interestAmount"
//                                         type="number"
//                                         placeholder="Enter interest amount"
//                                         value={interestPaid.toString()}
//                                         onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInterestPaid(parseFloat(e.target.value) || 0)}
//                                         className={`mt-1 ${paymentModal.installment.interestPaid >= paymentModal.installment.interestAmount ? 'cursor-not-allowed opacity-50' : ''}`}
//                                         max={(paymentModal.installment.interestAmount - paymentModal.installment.interestPaid).toString()}
//                                         min="0"
//                                         step="0.01"
//                                         disabled={paymentModal.installment.interestPaid >= paymentModal.installment.interestAmount}
//                                     />
//                                 </div>
//                                 {(paymentModal.installment.penaltyAmount > 0) && (
//                                     <div>
//                                         <label className="text-sm text-white">
//                                             Penalty Amount (Max: {paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid} {currency})
//                                         </label>
//                                         <Input
//                                             name="penaltyAmount"
//                                             type="number"
//                                             placeholder="Enter penalty amount"
//                                             value={penaltyPaid.toString()}
//                                             onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPenaltyPaid(parseFloat(e.target.value) || 0)}
//                                             className={`mt-1 ${paymentModal.installment.penaltyPaid >= paymentModal.installment.penaltyAmount ? 'cursor-not-allowed opacity-50' : ''}`}
//                                             max={(paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid).toString()}
//                                             min="0"
//                                             step="0.01"
//                                             disabled={paymentModal.installment.penaltyPaid >= paymentModal.installment.penaltyAmount}
//                                         />
//                                     </div>
//                                 )}
//                             </div>
//                         )}

//                         {(paymentModal.type === 'penalty' || paymentModal.type === 'edit-penalty') && (
//                             <div>
//                                 <label className="text-sm text-white">
//                                     Penalty Amount {paymentModal.type === 'edit-penalty' ? '(Edit)' : ''}
//                                 </label>
//                                 <Input
//                                     name="penaltyAmount"
//                                     type="number"
//                                     placeholder="Enter penalty amount"
//                                     value={penaltyAmount.toString()}
//                                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPenaltyAmount(parseFloat(e.target.value) || 0)}
//                                     className="mt-1"
//                                     min="0"
//                                     step="0.01"
//                                 />
//                                 {paymentModal.type === 'edit-penalty' && (
//                                     <p className="text-xs text-yellow-600 mt-1">
//                                         Current penalty: {paymentModal.installment.penaltyAmount} {currency}
//                                     </p>
//                                 )}
//                             </div>
//                         )}

//                         {(paymentModal.type === 'full' || paymentModal.type === 'remaining') && (
//                             <p className="text-sm text-yellow-600 dark:text-yellow-400">
//                                 {paymentModal.type === 'full' && (
//                                     spaceType === 'LOAN_BORROWED'
//                                         ? `You are about to pay full amount: ${paymentModal.installment.principalAmount - paymentModal.installment.principalPaid + paymentModal.installment.interestAmount - paymentModal.installment.interestPaid + paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid} ${currency}`
//                                         : `You are about to receive full amount: ${paymentModal.installment.principalAmount - paymentModal.installment.principalPaid + paymentModal.installment.interestAmount - paymentModal.installment.interestPaid + paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid} ${currency}`
//                                 )}
//                                 {paymentModal.type === 'remaining' && (
//                                     spaceType === 'LOAN_BORROWED'
//                                         ? `You are about to pay remaining balance: ${paymentModal.installment.principalAmount - paymentModal.installment.principalPaid + paymentModal.installment.interestAmount - paymentModal.installment.interestPaid + paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid} ${currency}`
//                                         : `You are about to receive remaining balance: ${paymentModal.installment.principalAmount - paymentModal.installment.principalPaid + paymentModal.installment.interestAmount - paymentModal.installment.interestPaid + paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid} ${currency}`
//                                 )}
//                             </p>
//                         )}

//                         <div className="flex justify-end gap-2 mt-4">
//                             <Button
//                                 text="Cancel"
//                                 priority="secondary"
//                                 onClick={() => {
//                                     setPaymentModal(null);
//                                     setPenaltyAmount(0);
//                                     setPenaltyPaid(0);
//                                 }}
//                             />
//                             <Button
//                                 text="Confirm"
//                                 onClick={
//                                     paymentModal.type === 'full' ? confirmFullPayment :
//                                         paymentModal.type === 'partial' ? confirmPartialPayment :
//                                             paymentModal.type === 'remaining' ? confirmRemainingPayment :
//                                                 confirmAddPenalty // Handles both add and edit penalty
//                                 }
//                             />
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// export default LoanInstallments;


/********************************************************************************************************************************************************/

import React, { useState, useEffect } from 'react';
import Button from '../../../Button';
import Input from '../../../Input';
import { getFormattedDate } from '../../../../utils/utils';
import { LoanRepaymentPlanService } from '../../../../services/loanRepaymentPlan.sevice';
import { TransactionService } from '../../../../services/transaction.service';
import { CategoryService } from '../../../../services/category.service';
import { TransactionType } from '../Transactions';
import LoanRepaymentPlanForm from './LoanRepaymentPlanForm';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';
import { toast } from 'react-toastify';

interface LoanInstallmentsProps {
    spaceId: string;
    spaceType: 'LOAN_LENT' | 'LOAN_BORROWED';
    planId: string;
    installments: any[];
    onRefresh: () => void;
    planDetails?: any;
}

interface CategoryMapping {
    pcategory: string | null;
    scategory: string | null;
}

interface CategoryMappings {
    principalRepayment: CategoryMapping | null;
    interestRepayment: CategoryMapping | null;
    penaltyCharge: CategoryMapping | null;
}

function LoanInstallments({ spaceId, spaceType, planId, installments, onRefresh, planDetails }: LoanInstallmentsProps) {
    const [paymentModal, setPaymentModal] = useState<{
        type: 'full' | 'partial' | 'penalty' | 'remaining' | 'edit-penalty';
        installment: any;
    } | null>(null);

    const [principalPaid, setPrincipalPaid] = useState<number>(0);
    const [interestPaid, setInterestPaid] = useState<number>(0);
    const [penaltyAmount, setPenaltyAmount] = useState<number>(0);
    const [penaltyPaid, setPenaltyPaid] = useState<number>(0);

    const [page, setPage] = useState<number>(1);
    const [pageLimit] = useState<number>(10);

    const [categoryMappings, setCategoryMappings] = useState<CategoryMappings>({
        principalRepayment: null,
        interestRepayment: null,
        penaltyCharge: null
    });

    const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);

    const [showEditForm, setShowEditForm] = useState(false);

    const [completePlanDetails, setCompletePlanDetails] = useState<any>(null);
    const [isLoadingPlanDetails, setIsLoadingPlanDetails] = useState<boolean>(false);

    const { updateInstallment, updateInstallmentPenalty, getPlanWithSpaceDetails } = LoanRepaymentPlanService();
    const { createTransaction } = TransactionService();
    const { getCategoriesBySpace } = CategoryService();
    const { currency } = useSelector((state: RootState) => state.auth);

    const handleEditClick = async () => {
        if (!planId) return;
        
        setIsLoadingPlanDetails(true);
        try {
            const details = await getPlanWithSpaceDetails(planId);
            if (details) {
                setCompletePlanDetails(details);
                setShowEditForm(true);
            } else {
                toast.error("Failed to load plan details");
            }
        } catch (error) {
            console.error("Error fetching plan details:", error);
            toast.error("Failed to load plan details");
        } finally {
            setIsLoadingPlanDetails(false);
        }
    };

        useEffect(() => {
        const fetchCategoryMappings = async () => {
            if (!spaceId || !spaceType) return;

            setIsLoadingCategories(true);
            try {
                const categories = await getCategoriesBySpace(spaceId);

                // Find appropriate categories based on space type
                if (spaceType === 'LOAN_LENT') {
                    // For LOAN_LENT: Need categories with REPAYMENT_RECEIVED and LOAN_CHARGES
                    const repaymentCategories = categories.filter((cat: any) =>
                        cat.transactionTypes && cat.transactionTypes.includes('REPAYMENT_RECEIVED')
                    );

                    // Find Principal Repayment subcategory
                    const principalRepayment = repaymentCategories.find((cat: any) =>
                        cat.subCategoryName && cat.subCategoryName.toLowerCase() === 'principal repayment'
                    );

                    // Find Interest subcategory
                    const interestRepayment = repaymentCategories.find((cat: any) =>
                        cat.subCategoryName && cat.subCategoryName.toLowerCase() === 'interest'
                    );

                    // Find Penalty subcategory with LOAN_CHARGES
                    const penaltyCategories = categories.filter((cat: any) =>
                        cat.transactionTypes && cat.transactionTypes.includes('LOAN_CHARGES')
                    );
                    const penaltyCharge = penaltyCategories.find((cat: any) =>
                        cat.subCategoryName && cat.subCategoryName.toLowerCase() === 'penalty'
                    );

                    setCategoryMappings({
                        principalRepayment: principalRepayment ? {
                            pcategory: principalRepayment.parentCategoryId,
                            scategory: principalRepayment.subCategoryId
                        } : null,
                        interestRepayment: interestRepayment ? {
                            pcategory: interestRepayment.parentCategoryId,
                            scategory: interestRepayment.subCategoryId
                        } : null,
                        penaltyCharge: penaltyCharge ? {
                            pcategory: penaltyCharge.parentCategoryId,
                            scategory: penaltyCharge.subCategoryId
                        } : null
                    });
                } else if (spaceType === 'LOAN_BORROWED') {
                    // For LOAN_BORROWED: Need categories with REPAYMENT_PAID and LOAN_CHARGES
                    const repaymentCategories = categories.filter((cat: any) =>
                        cat.transactionTypes && cat.transactionTypes.includes('REPAYMENT_PAID')
                    );

                    // Find Principal Repayment subcategory
                    const principalRepayment = repaymentCategories.find((cat: any) =>
                        cat.subCategoryName && cat.subCategoryName.toLowerCase() === 'principal repayment'
                    );

                    // Find Interest subcategory
                    const interestRepayment = repaymentCategories.find((cat: any) =>
                        cat.subCategoryName && cat.subCategoryName.toLowerCase() === 'interest'
                    );

                    // Find Penalty subcategory with LOAN_CHARGES
                    const penaltyCategories = categories.filter((cat: any) =>
                        cat.transactionTypes && cat.transactionTypes.includes('LOAN_CHARGES')
                    );
                    const penaltyCharge = penaltyCategories.find((cat: any) =>
                        cat.subCategoryName && cat.subCategoryName.toLowerCase() === 'penalty'
                    );

                    setCategoryMappings({
                        principalRepayment: principalRepayment ? {
                            pcategory: principalRepayment.parentCategoryId,
                            scategory: principalRepayment.subCategoryId
                        } : null,
                        interestRepayment: interestRepayment ? {
                            pcategory: interestRepayment.parentCategoryId,
                            scategory: interestRepayment.subCategoryId
                        } : null,
                        penaltyCharge: penaltyCharge ? {
                            pcategory: penaltyCharge.parentCategoryId,
                            scategory: penaltyCharge.subCategoryId
                        } : null
                    });
                }
            } catch (error) {
                console.error("Error fetching category mappings:", error);
                toast.error("Failed to load category mappings");
            } finally {
                setIsLoadingCategories(false);
            }
        };

        fetchCategoryMappings();
    }, [spaceId, spaceType, getCategoriesBySpace, setIsLoadingCategories, setCategoryMappings]);


    useEffect(() => {
        setPage(1);
    }, [installments]);

    // Calculate paginated installments
    const paginatedInstallments = installments.slice((page - 1) * pageLimit, page * pageLimit);
    const totalInstallments = installments.length;

    const handleFullPayment = async (installment: any) => {
        const remainingPrincipal = installment.principalAmount - installment.principalPaid;
        const remainingInterest = installment.interestAmount - installment.interestPaid;
        const remainingPenalty = installment.penaltyAmount - installment.penaltyPaid;

        if (remainingPrincipal <= 0 && remainingInterest <= 0 && remainingPenalty <= 0) {
            toast.info("This installment is already fully paid");
            return;
        }

        setPaymentModal({ type: 'full', installment });
    };

    const handlePartialPayment = (installment: any) => {
        setPaymentModal({ type: 'partial', installment });
        setPrincipalPaid(0);
        setInterestPaid(0);
        setPenaltyPaid(0);
    };

    const handleRemainingPayment = (installment: any) => {
        setPaymentModal({ type: 'remaining', installment });
        setPrincipalPaid(installment.principalAmount - installment.principalPaid);
        setInterestPaid(installment.interestAmount - installment.interestPaid);
        setPenaltyPaid(installment.penaltyAmount - installment.penaltyPaid);
    };

    const handleAddPenalty = (installment: any) => {
        setPaymentModal({ type: 'penalty', installment });
        setPenaltyAmount(0);
    };

    const handleEditPenalty = (installment: any) => {
        setPaymentModal({ type: 'edit-penalty', installment });
        setPenaltyAmount(installment.penaltyAmount);
    };

    const confirmFullPayment = async () => {
        if (!paymentModal) return;

        const installment = paymentModal.installment;
        const remainingPrincipal = installment.principalAmount - installment.principalPaid;
        const remainingInterest = installment.interestAmount - installment.interestPaid;
        const remainingPenalty = installment.penaltyAmount - installment.penaltyPaid;

        const totalAmount = remainingPrincipal + remainingInterest + remainingPenalty;

        try {
            // Update installment
            await updateInstallment(installment._id, {
                principalPaid: installment.principalPaid + remainingPrincipal,
                interestPaid: installment.interestPaid + remainingInterest,
                penaltyPaid: installment.penaltyPaid + remainingPenalty,
                status: 'PAID'
            });


            // Create transactions
            if (remainingPrincipal > 0) {
                await createTransaction({
                    type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
                    amount: remainingPrincipal,
                    from: spaceType === 'LOAN_LENT' ? spaceId : null,
                    to: spaceType === 'LOAN_LENT' ? null : spaceId,
                    date: new Date().toISOString().split('T')[0],
                    note: spaceType === 'LOAN_LENT'
                        ? `Principal received for installment ${getFormattedDate(installment.endDate)}`
                        : `Principal paid for installment ${getFormattedDate(installment.endDate)}`,
                    pcategory: categoryMappings.principalRepayment?.pcategory || null,
                    scategory: categoryMappings.principalRepayment?.scategory || null,
                    spaceId: spaceId,
                    loanRepaymentPlanId: planId
                });
            }
            if (remainingInterest > 0) {
                await createTransaction({
                    type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
                    amount: remainingInterest,
                    from: spaceType === 'LOAN_LENT' ? spaceId : null,
                    to: spaceType === 'LOAN_LENT' ? null : spaceId,
                    date: new Date().toISOString().split('T')[0],
                    note: spaceType === 'LOAN_LENT'
                        ? `Interest received for installment ${getFormattedDate(installment.endDate)}`
                        : `Interest paid for installment ${getFormattedDate(installment.endDate)}`,
                    pcategory: categoryMappings.interestRepayment?.pcategory || null,
                    scategory: categoryMappings.interestRepayment?.scategory || null,
                    spaceId: spaceId,
                    loanRepaymentPlanId: planId
                });
            }
            if (remainingPenalty > 0) {
                await createTransaction({
                    type: TransactionType.LOAN_CHARGES,
                    amount: remainingPenalty,
                    from: spaceType === 'LOAN_LENT' ? spaceId : null,
                    to: spaceType === 'LOAN_LENT' ? null : spaceId,
                    date: new Date().toISOString().split('T')[0],
                    note: spaceType === 'LOAN_LENT'
                        ? `Penalty received for installment ${getFormattedDate(installment.endDate)}`
                        : `Penalty paid for installment ${getFormattedDate(installment.endDate)}`,
                    pcategory: categoryMappings.penaltyCharge?.pcategory || null,
                    scategory: categoryMappings.penaltyCharge?.scategory || null,
                    spaceId: spaceId,
                    loanRepaymentPlanId: planId
                });
            }

            toast.success(
                spaceType === 'LOAN_LENT'
                    ? `Full collection of ${totalAmount} ${currency} recorded successfully`
                    : `Full payment of ${totalAmount} ${currency} recorded successfully`
            );
            onRefresh();
            setPaymentModal(null);
        } catch (error) {
            console.error("Error processing payment:", error);
            toast.error(
                spaceType === 'LOAN_LENT'
                    ? "Failed to process full collection"
                    : "Failed to process full payment"
            );
        }
    };

    const confirmPartialPayment = async () => {
        if (!paymentModal) return;

        const installment = paymentModal.installment;

        if (principalPaid <= 0 && interestPaid <= 0 && penaltyPaid <= 0) {
            toast.error("Please enter payment amount");
            return;
        }

        if (principalPaid > (installment.principalAmount - installment.principalPaid)) {
            toast.error("Principal paid exceeds remaining amount");
            return;
        }

        if (interestPaid > (installment.interestAmount - installment.interestPaid)) {
            toast.error("Interest paid exceeds remaining amount");
            return;
        }

        if (penaltyPaid > (installment.penaltyAmount - installment.penaltyPaid)) {
            toast.error("Penalty paid exceeds remaining amount");
            return;
        }

        try {
            const newPrincipalPaid = installment.principalPaid + principalPaid;
            const newInterestPaid = installment.interestPaid + interestPaid;
            const newPenaltyPaid = installment.penaltyPaid + penaltyPaid;

            let status = installment.status;
            if (newPrincipalPaid >= installment.principalAmount &&
                newInterestPaid >= installment.interestAmount &&
                newPenaltyPaid >= installment.penaltyAmount) {
                status = 'PAID';
            } else if (newPrincipalPaid > 0 || newInterestPaid > 0 || newPenaltyPaid > 0) {
                status = 'PARTIAL_PAID';
            }

            await updateInstallment(installment._id, {
                principalPaid: newPrincipalPaid,
                interestPaid: newInterestPaid,
                penaltyPaid: newPenaltyPaid,
                status
            });

            // Create transactions
            if (principalPaid > 0) {
                await createTransaction({
                    type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
                    amount: principalPaid,
                    from: spaceType === 'LOAN_LENT' ? spaceId : null,
                    to: spaceType === 'LOAN_LENT' ? null : spaceId,
                    date: new Date().toISOString().split('T')[0],
                    note: spaceType === 'LOAN_LENT'
                        ? `Partial principal received for installment ${getFormattedDate(installment.endDate)}`
                        : `Partial principal paid for installment ${getFormattedDate(installment.endDate)}`,
                    pcategory: categoryMappings.principalRepayment?.pcategory || null,
                    scategory: categoryMappings.principalRepayment?.scategory || null,
                    spaceId: spaceId,
                    loanRepaymentPlanId: planId
                });
            }

            if (interestPaid > 0) {
                await createTransaction({
                    type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
                    amount: interestPaid,
                    from: spaceType === 'LOAN_LENT' ? spaceId : null,
                    to: spaceType === 'LOAN_LENT' ? null : spaceId,
                    date: new Date().toISOString().split('T')[0],
                    note: spaceType === 'LOAN_LENT'
                        ? `Partial interest received for installment ${getFormattedDate(installment.endDate)}`
                        : `Partial interest paid for installment ${getFormattedDate(installment.endDate)}`,
                    pcategory: categoryMappings.interestRepayment?.pcategory || null,
                    scategory: categoryMappings.interestRepayment?.scategory || null,
                    spaceId: spaceId,
                    loanRepaymentPlanId: planId
                });
            }

            if (penaltyPaid > 0) {
                await createTransaction({
                    type: TransactionType.LOAN_CHARGES,
                    amount: penaltyPaid,
                    from: spaceType === 'LOAN_LENT' ? spaceId : null,
                    to: spaceType === 'LOAN_LENT' ? null : spaceId,
                    date: new Date().toISOString().split('T')[0],
                    note: spaceType === 'LOAN_LENT'
                        ? `Partial penalty received for installment ${getFormattedDate(installment.endDate)}`
                        : `Partial penalty paid for installment ${getFormattedDate(installment.endDate)}`,
                    pcategory: categoryMappings.penaltyCharge?.pcategory || null,
                    scategory: categoryMappings.penaltyCharge?.scategory || null,
                    spaceId: spaceId,
                    loanRepaymentPlanId: planId
                });
            }
            toast.success(
                spaceType === 'LOAN_LENT'
                    ? "Partial collection recorded successfully"
                    : "Partial payment recorded successfully"
            );
            onRefresh();
            setPaymentModal(null);
        } catch (error) {
            console.error("Error processing partial payment:", error);
            toast.error(
                spaceType === 'LOAN_LENT'
                    ? "Failed to process partial collection"
                    : "Failed to process partial payment"
            );
        }
    };

    const confirmAddPenalty = async () => {
        if (!paymentModal) return;

        if (penaltyAmount <= 0) {
            toast.error("Please enter valid penalty amount");
            return;
        }

        try {
            const installment = paymentModal.installment;

            if (paymentModal.type === 'edit-penalty') {
                // For edit, we need to update the penalty amount
                await updateInstallmentPenalty(installment._id, penaltyAmount);
                toast.success("Penalty updated successfully!");
            } else {
                // For add, we add to existing penalty
                await updateInstallmentPenalty(installment._id, (installment.penaltyAmount || 0) + penaltyAmount);
                toast.success("Penalty added successfully!");
            }

            onRefresh(); // Refresh data to reflect penalty changes
            setPaymentModal(null);
            setPenaltyAmount(0);
        } catch (error) {
            console.error("Error processing penalty:", error);
            toast.error("Failed to process penalty");
        }
    };

    const confirmRemainingPayment = async () => {
        if (!paymentModal) return;

        const installment = paymentModal.installment;
        const remainingPrincipal = installment.principalAmount - installment.principalPaid;
        const remainingInterest = installment.interestAmount - installment.interestPaid;
        const remainingPenalty = installment.penaltyAmount - installment.penaltyPaid;


        try {
            await updateInstallment(installment._id, {
                principalPaid: installment.principalAmount,
                interestPaid: installment.interestAmount,
                penaltyPaid: installment.penaltyAmount,
                status: 'PAID'
            });

            if (remainingPrincipal > 0) {
                await createTransaction({
                    type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
                    amount: remainingPrincipal,
                    from: spaceType === 'LOAN_LENT' ? spaceId : null,
                    to: spaceType === 'LOAN_LENT' ? null : spaceId,
                    date: new Date().toISOString().split('T')[0],
                    note: spaceType === 'LOAN_LENT'
                        ? `Remaining principal received for installment ${getFormattedDate(installment.endDate)}`
                        : `Remaining principal paid for installment ${getFormattedDate(installment.endDate)}`,
                    pcategory: categoryMappings.principalRepayment?.pcategory || null,
                    scategory: categoryMappings.principalRepayment?.scategory || null,
                    spaceId: spaceId,
                    loanRepaymentPlanId: planId
                });
            }

            if (remainingInterest > 0) {
                await createTransaction({
                    type: spaceType === 'LOAN_LENT' ? TransactionType.REPAYMENT_RECEIVED : TransactionType.REPAYMENT_PAID,
                    amount: remainingInterest,
                    from: spaceType === 'LOAN_LENT' ? spaceId : null,
                    to: spaceType === 'LOAN_LENT' ? null : spaceId,
                    date: new Date().toISOString().split('T')[0],
                    note: spaceType === 'LOAN_LENT'
                        ? `Remaining interest received for installment ${getFormattedDate(installment.endDate)}`
                        : `Remaining interest paid for installment ${getFormattedDate(installment.endDate)}`,
                    pcategory: categoryMappings.interestRepayment?.pcategory || null,
                    scategory: categoryMappings.interestRepayment?.scategory || null,
                    spaceId: spaceId,
                    loanRepaymentPlanId: planId
                });
            }

            if (remainingPenalty > 0) {
                await createTransaction({
                    type: TransactionType.LOAN_CHARGES,
                    amount: remainingPenalty,
                    from: spaceType === 'LOAN_LENT' ? spaceId : null,
                    to: spaceType === 'LOAN_LENT' ? null : spaceId,
                    date: new Date().toISOString().split('T')[0],
                    note: spaceType === 'LOAN_LENT'
                        ? `Remaining penalty received for installment ${getFormattedDate(installment.endDate)}`
                        : `Remaining penalty paid for installment ${getFormattedDate(installment.endDate)}`,
                    pcategory: categoryMappings.penaltyCharge?.pcategory || null,
                    scategory: categoryMappings.penaltyCharge?.scategory || null,
                    spaceId: spaceId,
                    loanRepaymentPlanId: planId
                });
            }

            toast.success(
                spaceType === 'LOAN_LENT'
                    ? `Remaining balance collected successfully`
                    : `Remaining balance paid successfully`
            );
            onRefresh();
            setPaymentModal(null);
        } catch (error) {
            console.error("Error paying remaining balance:", error);
            toast.error(
                spaceType === 'LOAN_LENT'
                    ? "Failed to collect remaining balance"
                    : "Failed to pay remaining balance"
            );
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PAID':
                return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">PAID</span>;
            case 'PARTIAL_PAID':
                return <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">PARTIAL</span>;
            case 'OVERDUE':
                return <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">OVERDUE</span>;
            default:
                return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">PENDING</span>;
        }
    };

    return (
        <div className="mt-5">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                    Installments
                </h2>

                {planDetails && (
                    <Button
                        text={isLoadingPlanDetails ? "Loading..." : "Edit Plan"}
                        className="max-w-fit"
                        onClick={handleEditClick}
                        disabled={isLoadingPlanDetails}
                    />
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="p-2 text-left text-sm text-white">Period</th>
                            <th className="p-2 text-left text-sm text-white">Due Date</th>
                            <th className="p-2 text-right text-sm text-white">Principal</th>
                            <th className="p-2 text-right text-sm text-white">Interest</th>
                            <th className="p-2 text-right text-sm text-white">Penalty</th>
                            <th className="p-2 text-right text-sm text-white">Paid</th>
                            <th className="p-2 text-center text-sm text-white">Status</th>
                            <th className="p-2 text-center text-sm  text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedInstallments.map((inst, index) => {

                            const absoluteIndex = (page - 1) * pageLimit + index;

                            const isOverdue = new Date(inst.endDate) < new Date() && inst.status !== 'PAID';
                            const remainingPrincipal = inst.principalAmount - inst.principalPaid;
                            const remainingInterest = inst.interestAmount - inst.interestPaid;
                            const remainingPenalty = inst.penaltyAmount - inst.penaltyPaid;
                            const isPartiallyPaid = inst.principalPaid > 0 || inst.interestPaid > 0 || inst.penaltyPaid > 0;

                            const hasPenalty = inst.penaltyAmount > 0;

                            return (
                                <tr
                                    key={inst._id}
                                    className={`border-b border-border-light-primary dark:border-border-dark-primary hover:bg-hover-light-primary dark:hover:bg-hover-dark-primary
                                        ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                                >
                                    <td className="p-2 text-sm text-white">{absoluteIndex + 1}</td>
                                    <td className="p-2 text-sm text-white">{getFormattedDate(inst.endDate)}</td>
                                    <td className="p-2 text-right text-sm text-white">{inst.principalAmount} {currency}</td>
                                    <td className="p-2 text-right text-sm text-white">{inst.interestAmount} {currency}</td>
                                    <td className="p-2 text-right text-sm text-white">{inst.penaltyAmount} {currency}</td>
                                    <td className="p-2 text-right text-sm text-white">
                                        {inst.principalPaid + inst.interestPaid + inst.penaltyPaid} {currency}
                                    </td>
                                    <td className="p-2 text-center">
                                        {getStatusBadge(isOverdue ? 'OVERDUE' : inst.status)}
                                    </td>
                                    <td className="p-2">
                                        <div className="flex gap-1 flex-wrap justify-center">
                                            {inst.status !== 'PAID' && (
                                                <>
                                                    {/* Full payment button */}
                                                    {(remainingPrincipal > 0 || remainingInterest > 0) && (
                                                        <Button
                                                            text="Full"
                                                            className="max-w-fit text-xs py-1 px-2"
                                                            onClick={() => handleFullPayment(inst)}
                                                        />
                                                    )}

                                                    {/* Show Partial button only if NOT partially paid */}
                                                    {(remainingPrincipal > 0 || remainingInterest > 0 || remainingPenalty > 0) && (
                                                        <Button
                                                            text="Partial"
                                                            className="max-w-fit text-xs py-1 px-2"
                                                            priority="secondary"
                                                            onClick={() => handlePartialPayment(inst)}
                                                        />
                                                    )}

                                                    {/* Show Remaining button if partially paid AND any amount remaining */}
                                                    {isPartiallyPaid && (remainingPrincipal > 0 || remainingInterest > 0 || remainingPenalty > 0) && (
                                                        <Button
                                                            text="Remaining"
                                                            className="max-w-fit text-xs py-1 px-2 bg-blue-500 hover:bg-blue-600"
                                                            onClick={() => handleRemainingPayment(inst)}
                                                        />
                                                    )}

                                                    {/* Penalty button - Show Edit Penalty if penalty exists, otherwise Add Penalty */}
                                                    {hasPenalty ? (
                                                        <Button
                                                            text="Edit Penalty"
                                                            className="max-w-fit text-xs py-1 px-2 bg-orange-500 hover:bg-orange-600"
                                                            onClick={() => handleEditPenalty(inst)}
                                                        />
                                                    ) : (
                                                        <Button
                                                            text="Add Penalty"
                                                            className="max-w-fit text-xs py-1 px-2 bg-red-500 hover:bg-red-600"
                                                            onClick={() => handleAddPenalty(inst)}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalInstallments > 0 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                        text={`${(page - 1) * pageLimit + 1}-${Math.min((page - 1) * pageLimit + paginatedInstallments.length, totalInstallments)} of ${totalInstallments}`}
                        className="max-w-fit bg-transparent pointer-events-none text-text-light-primary dark:text-text-dark-primary"
                        onClick={() => { }}
                    />
                    <Button
                        text="Prev"
                        className="max-w-fit bg-transparent border border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary"
                        onClick={() => setPage(prev => prev - 1)}
                        disabled={page === 1}
                    />
                    <Button
                        text="Next"
                        className="max-w-fit bg-transparent border border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary"
                        onClick={() => setPage(prev => prev + 1)}
                        disabled={page * pageLimit >= totalInstallments}
                    />
                </div>
            )}

            {/* Payment Modals */}
            {paymentModal && (
                <div className="fixed top-0 left-0 w-screen h-screen z-[1000] grid place-items-center bg-opacity-50 modal-bg">
                    <div className="w-full max-w-md bg-bg-light-secondary dark:bg-bg-dark-secondary rounded-lg p-4">
                        <h3 className="text-lg font-bold mb-3 text-white">
                            {paymentModal.type === 'full' && (
                                spaceType === 'LOAN_BORROWED' ? 'Confirm Full Payment' : 'Confirm Full Collection'
                            )}
                            {paymentModal.type === 'partial' && (
                                spaceType === 'LOAN_BORROWED' ? 'Partial Payment' : 'Partial Collection'
                            )}
                            {paymentModal.type === 'penalty' && 'Add Penalty'}
                            {paymentModal.type === 'edit-penalty' && 'Edit Penalty'}
                            {paymentModal.type === 'remaining' && (
                                spaceType === 'LOAN_BORROWED' ? 'Pay Remaining Balance' : 'Receive Remaining Balance'
                            )}
                        </h3>

                        {(paymentModal.type === 'partial' || paymentModal.type === 'remaining') && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm text-white">Principal Amount (Max: {paymentModal.installment.principalAmount - paymentModal.installment.principalPaid} {currency})</label>
                                    <Input
                                        name="principalAmount"
                                        type="number"
                                        placeholder="Enter principal amount"
                                        value={principalPaid.toString()}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrincipalPaid(parseFloat(e.target.value) || 0)}
                                        className={`mt-1 ${paymentModal.installment.principalPaid >= paymentModal.installment.principalAmount ? 'cursor-not-allowed opacity-50' : ''}`}
                                        max={(paymentModal.installment.principalAmount - paymentModal.installment.principalPaid).toString()}
                                        min="0"
                                        step="0.01"
                                        disabled={paymentModal.installment.principalPaid >= paymentModal.installment.principalAmount}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-white">Interest Amount (Max: {paymentModal.installment.interestAmount - paymentModal.installment.interestPaid} {currency})</label>
                                    <Input
                                        name="interestAmount"
                                        type="number"
                                        placeholder="Enter interest amount"
                                        value={interestPaid.toString()}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInterestPaid(parseFloat(e.target.value) || 0)}
                                        className={`mt-1 ${paymentModal.installment.interestPaid >= paymentModal.installment.interestAmount ? 'cursor-not-allowed opacity-50' : ''}`}
                                        max={(paymentModal.installment.interestAmount - paymentModal.installment.interestPaid).toString()}
                                        min="0"
                                        step="0.01"
                                        disabled={paymentModal.installment.interestPaid >= paymentModal.installment.interestAmount}
                                    />
                                </div>
                                {(paymentModal.installment.penaltyAmount > 0) && (
                                    <div>
                                        <label className="text-sm text-white">
                                            Penalty Amount (Max: {paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid} {currency})
                                        </label>
                                        <Input
                                            name="penaltyAmount"
                                            type="number"
                                            placeholder="Enter penalty amount"
                                            value={penaltyPaid.toString()}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPenaltyPaid(parseFloat(e.target.value) || 0)}
                                            className={`mt-1 ${paymentModal.installment.penaltyPaid >= paymentModal.installment.penaltyAmount ? 'cursor-not-allowed opacity-50' : ''}`}
                                            max={(paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid).toString()}
                                            min="0"
                                            step="0.01"
                                            disabled={paymentModal.installment.penaltyPaid >= paymentModal.installment.penaltyAmount}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {(paymentModal.type === 'penalty' || paymentModal.type === 'edit-penalty') && (
                            <div>
                                <label className="text-sm text-white">
                                    Penalty Amount {paymentModal.type === 'edit-penalty' ? '(Edit)' : ''}
                                </label>
                                <Input
                                    name="penaltyAmount"
                                    type="number"
                                    placeholder="Enter penalty amount"
                                    value={penaltyAmount.toString()}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPenaltyAmount(parseFloat(e.target.value) || 0)}
                                    className="mt-1"
                                    min="0"
                                    step="0.01"
                                />
                                {paymentModal.type === 'edit-penalty' && (
                                    <p className="text-xs text-yellow-600 mt-1">
                                        Current penalty: {paymentModal.installment.penaltyAmount} {currency}
                                    </p>
                                )}
                            </div>
                        )}

                        {(paymentModal.type === 'full' || paymentModal.type === 'remaining') && (
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                {paymentModal.type === 'full' && (
                                    spaceType === 'LOAN_BORROWED'
                                        ? `You are about to pay full amount: ${paymentModal.installment.principalAmount - paymentModal.installment.principalPaid + paymentModal.installment.interestAmount - paymentModal.installment.interestPaid + paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid} ${currency}`
                                        : `You are about to receive full amount: ${paymentModal.installment.principalAmount - paymentModal.installment.principalPaid + paymentModal.installment.interestAmount - paymentModal.installment.interestPaid + paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid} ${currency}`
                                )}
                                {paymentModal.type === 'remaining' && (
                                    spaceType === 'LOAN_BORROWED'
                                        ? `You are about to pay remaining balance: ${paymentModal.installment.principalAmount - paymentModal.installment.principalPaid + paymentModal.installment.interestAmount - paymentModal.installment.interestPaid + paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid} ${currency}`
                                        : `You are about to receive remaining balance: ${paymentModal.installment.principalAmount - paymentModal.installment.principalPaid + paymentModal.installment.interestAmount - paymentModal.installment.interestPaid + paymentModal.installment.penaltyAmount - paymentModal.installment.penaltyPaid} ${currency}`
                                )}
                            </p>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                            <Button
                                text="Cancel"
                                priority="secondary"
                                onClick={() => {
                                    setPaymentModal(null);
                                    setPenaltyAmount(0);
                                    setPenaltyPaid(0);
                                }}
                            />
                            <Button
                                text="Confirm"
                                onClick={
                                    paymentModal.type === 'full' ? confirmFullPayment :
                                        paymentModal.type === 'partial' ? confirmPartialPayment :
                                            paymentModal.type === 'remaining' ? confirmRemainingPayment :
                                                confirmAddPenalty // Handles both add and edit penalty
                                }
                            />
                        </div>
                    </div>
                </div>
            )}

            {showEditForm && completePlanDetails && (
                <LoanRepaymentPlanForm
                    spaceId={spaceId}
                    spaceType={spaceType}
                    defaultLoanAmount={completePlanDetails?.loanAmount || 0}
                    defaultStartDate={completePlanDetails?.startDate?.split('T')[0] || ''}
                    defaultEndDate={completePlanDetails?.endDate?.split('T')[0] || ''}
                    onCancel={() => {
                        setShowEditForm(false);
                        setCompletePlanDetails(null);
                    }}
                    onSuccess={() => {
                        setShowEditForm(false);
                        setCompletePlanDetails(null);
                        onRefresh();
                    }}
                    planId={planId}
                    existingPlan={completePlanDetails}
                />
            )}
        </div>
    );
}

export default LoanInstallments;