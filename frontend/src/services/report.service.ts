import axios from 'axios';
import { api } from '../config/api.config';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store/store';
import { SpaceType } from '../components/user.portal/views/Spaces';
import { useState } from 'react';

export function ReportService() {
    const token = useSelector((state: RootState) => state.auth.token);
    const [loading, setLoading] = useState<boolean>(false);

    async function getTransactionLedger(format: string, spaces: string[], from: string, to: string, isCollaborative: boolean): Promise<any> {
        try {
            setLoading(true);
            api.post(`report/export/transaction-ledger`,
                {
                    format,
                    spaces: spaces,
                    fromDate: from,
                    toDate: to,
                    isCollaborative: isCollaborative
                },
                {
                    responseType: 'arraybuffer',
                    headers: {
                        'Accept': format === "PDF" ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then((response) => {
                    if (format === "PDF") {
                        const blob = new Blob([response.data], { type: 'application/pdf' });

                        const url = window.URL.createObjectURL(blob);

                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute(
                            'download',
                            `Account Ledger (${from}-${to}).pdf`
                        );

                        document.body.appendChild(link);
                        link.click();

                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    } else if (format === "EXCEL") {
                        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                        const url = window.URL.createObjectURL(blob);

                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute(
                            'download',
                            `Account Ledger (${from}-${to}).xlsx`
                        );

                        document.body.appendChild(link);
                        link.click();

                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    }
                })
        } catch (error) {
            processError(error)
            return []
        } finally{            
            setLoading(false);
        }
    }

    async function getLoanLedger(format: string, space: string, to: string): Promise<any> {
        try {
            setLoading(true);
            api.post(`report/export/loan-ledger`,
                {
                    format,
                    space: space,
                    toDate: to,
                },
                {
                    responseType: 'arraybuffer',
                    headers: {
                        'Accept': format === "PDF" ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then((response) => {
                    if (format === "PDF") {
                        const blob = new Blob([response.data], { type: 'application/pdf' });

                        const url = window.URL.createObjectURL(blob);

                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute(
                            'download',
                            `Loan Ledger (${to}).pdf`
                        );

                        document.body.appendChild(link);
                        link.click();

                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    } else if (format === "EXCEL") {
                        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                        const url = window.URL.createObjectURL(blob);

                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute(
                            'download',
                            `Loan Ledger (${to}).xlsx`
                        );

                        document.body.appendChild(link);
                        link.click();

                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    }
                })
        } catch (error) {
            processError(error)
            return []
        } finally{            
            setLoading(false);
        }
    }

    async function getCreditCardLedger(format: string, space: string, from: string, to: string): Promise<any> {
        try {
            setLoading(true);
            api.post(`report/export/credit-card-ledger`,
                {
                    format,
                    fromDate: from,
                    toDate: to,
                    space: space},
                {
                    responseType: 'arraybuffer',
                    headers: {
                        'Accept': format === "PDF" ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then((response) => {
                    if (format === "PDF") {
                        const blob = new Blob([response.data], { type: 'application/pdf' });

                        const url = window.URL.createObjectURL(blob);

                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute(
                            'download',
                            `Credit card Ledger (${from}-${to}).pdf`
                        );

                        document.body.appendChild(link);
                        link.click();

                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    } else if (format === "EXCEL") {
                        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                        const url = window.URL.createObjectURL(blob);

                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute(
                            'download',
                            `Credit card Ledger (${from}-${to}).xlsx`
                        );

                        document.body.appendChild(link);
                        link.click();

                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    }
                })
        } catch (error) {
            processError(error)
            return []
        } finally{            
            setLoading(false);
        }
    }



    return { getTransactionLedger, getLoanLedger, getCreditCardLedger, loading };
}

function processError(error: unknown): void {
    if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.error?.message || "An error occurred while processing your request.";
        toast.error(errorMessage);
    } else {
        toast.error("An unexpected error occurred. Please try again later.");
    }
    console.error("Error details:", error);
}
