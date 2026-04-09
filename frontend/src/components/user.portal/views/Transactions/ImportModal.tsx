import React, { useMemo, useState } from 'react';
import { FaTimes, FaDownload, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Button from '../../../Button';
import { CategoryInfo, SpaceInfo } from '../../../../interfaces/modals';
import { ImportResult, ImportRow } from '../../../../services/transaction.service';

interface ValidatedRow {
    raw: ImportRow;
    errors: string[];
    isValid: boolean;
}

interface ImportModalProps {
    rows: ImportRow[];
    spaces: SpaceInfo[];
    categories: CategoryInfo[];
    onClose: () => void;
    onImportComplete: () => void;
    importTransactions: (rows: ImportRow[]) => Promise<ImportResult | null>;
}

const VALID_TYPES = new Set([
    'EXPENSE', 'INCOME', 'INTERNAL_TRANSFER', 'LOAN_CHARGES', 'LOAN_PRINCIPAL',
    'BALANCE_INCREASE', 'BALANCE_DECREASE', 'REPAYMENT_PAID', 'REPAYMENT_RECEIVED',
    'SAVING', 'WITHDRAW',
]);

function validateRow(row: ImportRow, spaces: SpaceInfo[], categories: CategoryInfo[]): string[] {
    const errors: string[] = [];

    // Type
    if (!row.type) {
        errors.push('Type is required');
    } else if (!VALID_TYPES.has(row.type)) {
        errors.push(`Invalid type "${row.type}"`);
    }

    // Amount
    const amount = parseFloat(row.amount);
    if (!row.amount || isNaN(amount) || amount <= 0) {
        errors.push('Amount must be a positive number');
    }

    // Date
    if (!row.date) {
        errors.push('Date is required');
    } else if (isNaN(new Date(row.date).getTime())) {
        errors.push('Invalid date — use YYYY-MM-DD format');
    }

    // Space (active space)
    if (!row.spaceName || row.spaceName.trim() === '') {
        errors.push('Space is required');
    } else {
        const found = spaces.find(s => s.name.toLowerCase() === row.spaceName.trim().toLowerCase());
        if (!found) errors.push(`Space "${row.spaceName}" not found`);
    }

    // From space (optional — empty means outside wallet)
    if (row.fromSpaceName && row.fromSpaceName.trim() !== '') {
        const found = spaces.find(s => s.name.toLowerCase() === row.fromSpaceName.trim().toLowerCase());
        if (!found) errors.push(`From space "${row.fromSpaceName}" not found`);
    }

    // To space (optional — empty means outside wallet)
    if (row.toSpaceName && row.toSpaceName.trim() !== '') {
        const found = spaces.find(s => s.name.toLowerCase() === row.toSpaceName.trim().toLowerCase());
        if (!found) errors.push(`To space "${row.toSpaceName}" not found`);
    }

    // Category
    if (!row.pcategoryName || row.pcategoryName.trim() === '') {
        errors.push('Category is required');
    } else {
        const parentExists = categories.some(
            c => c.parentCategory.toLowerCase() === row.pcategoryName.trim().toLowerCase()
        );
        if (!parentExists) {
            errors.push(`Category "${row.pcategoryName}" not found`);
        } else if (row.scategoryName && row.scategoryName.trim() !== '') {
            const subExists = categories.some(
                c =>
                    c.parentCategory.toLowerCase() === row.pcategoryName.trim().toLowerCase() &&
                    c.subCategoryName.toLowerCase() === row.scategoryName.trim().toLowerCase()
            );
            if (!subExists) {
                errors.push(`Sub category "${row.scategoryName}" not found in "${row.pcategoryName}"`);
            }
        }
    }

    // Sub category
    if (!row.scategoryName || row.scategoryName.trim() === '') {
        errors.push('Sub category is required');
    }

    return errors;
}

function downloadTemplate() {
    const header = 'type,amount,space,from_space,to_space,pcategory,scategory,date,note';
    const examples = [
        'EXPENSE,1250.00,My Cash,My Cash,,Food & Drinks,Groceries,2025-01-15,Weekly groceries',
        'INCOME,5000.00,My Bank,,My Bank,Income,Salary,2025-01-16,January salary',
        'INTERNAL_TRANSFER,500.00,My Cash,My Cash,Savings,,transfer,2025-01-17,Transfer to savings',
    ];
    const csv = [header, ...examples].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function downloadFailedRows(failed: ImportResult['failed'], originalRows: ImportRow[]) {
    const header = 'type,amount,space,from_space,to_space,pcategory,scategory,date,note,error';
    const csvRows = failed.map(f => {
        const r = f.data;
        const escape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
        return [
            escape(r.type),
            escape(r.amount),
            escape(r.spaceName),
            escape(r.fromSpaceName),
            escape(r.toSpaceName),
            escape(r.pcategoryName),
            escape(r.scategoryName),
            escape(r.date),
            escape(r.note),
            escape(f.reason),
        ].join(',');
    });
    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'failed_rows.csv';
    a.click();
    URL.revokeObjectURL(url);
}

export default function ImportModal({ rows, spaces, categories, onClose, onImportComplete, importTransactions }: ImportModalProps) {
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const validatedRows = useMemo<ValidatedRow[]>(() => {
        return rows.map(row => {
            const errors = validateRow(row, spaces, categories);
            return { raw: row, errors, isValid: errors.length === 0 };
        });
    }, [rows, spaces, categories]);

    const validCount = validatedRows.filter(r => r.isValid).length;
    const invalidCount = validatedRows.length - validCount;

    const handleImport = async () => {
        const validRows = validatedRows.filter(r => r.isValid).map(r => r.raw);
        if (validRows.length === 0) return;

        setImporting(true);
        try {
            const importResult = await importTransactions(validRows);
            if (importResult) {
                if (importResult.imported > 0) {
                    onImportComplete();
                }
                if (importResult.failed.length > 0) {
                    // Partial failure — stay open so user can download failed rows
                    setResult(importResult);
                } else {
                    // Full success — close and show toast
                    toast.success(`${importResult.imported} transaction${importResult.imported !== 1 ? 's' : ''} imported successfully!`);
                    onClose();
                }
            }
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="fixed top-0 left-0 w-screen h-screen z-[999] flex items-center justify-center bg-black/60 p-4">
            <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border-light-primary dark:border-border-dark-primary shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                            Import Transactions
                        </h2>
                        {!result && (
                            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
                                {validCount} valid &nbsp;·&nbsp;
                                <span className={invalidCount > 0 ? 'text-red-400' : ''}>{invalidCount} invalid</span>
                                &nbsp;·&nbsp; {rows.length} total
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                            title="Download CSV template"
                        >
                            <FaDownload size={12} /> Template
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded hover:bg-border-light-primary dark:hover:bg-border-dark-primary text-text-light-secondary dark:text-text-dark-secondary"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Result view */}
                {result ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                        <FaCheckCircle size={48} className="text-green-400" />
                        <h3 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                            Import Complete
                        </h3>
                        <div className="text-center text-sm text-text-light-secondary dark:text-text-dark-secondary space-y-1">
                            <p><span className="text-green-400 font-medium">{result.imported}</span> transactions imported successfully</p>
                            {result.failed.length > 0 && (
                                <p><span className="text-red-400 font-medium">{result.failed.length}</span> rows failed</p>
                            )}
                        </div>
                        <div className="flex gap-3 mt-2">
                            {result.failed.length > 0 && (
                                <Button
                                    text="Download failed rows"
                                    className="max-w-fit"
                                    priority="secondary"
                                    onClick={() => downloadFailedRows(result.failed, rows)}
                                />
                            )}
                            <Button
                                text="Close"
                                className="max-w-fit"
                                onClick={onClose}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-xs text-text-light-primary dark:text-text-dark-primary border-collapse">
                                <thead className="sticky top-0 bg-bg-light-secondary dark:bg-bg-dark-secondary z-10">
                                    <tr className="border-b border-border-light-primary dark:border-border-dark-primary">
                                        <th className="px-3 py-2 text-left font-medium text-text-light-secondary dark:text-text-dark-secondary w-8">#</th>
                                        <th className="px-3 py-2 text-left font-medium text-text-light-secondary dark:text-text-dark-secondary">Type</th>
                                        <th className="px-3 py-2 text-left font-medium text-text-light-secondary dark:text-text-dark-secondary">Amount</th>
                                        <th className="px-3 py-2 text-left font-medium text-text-light-secondary dark:text-text-dark-secondary">Space</th>
                                        <th className="px-3 py-2 text-left font-medium text-text-light-secondary dark:text-text-dark-secondary">From</th>
                                        <th className="px-3 py-2 text-left font-medium text-text-light-secondary dark:text-text-dark-secondary">To</th>
                                        <th className="px-3 py-2 text-left font-medium text-text-light-secondary dark:text-text-dark-secondary">Category</th>
                                        <th className="px-3 py-2 text-left font-medium text-text-light-secondary dark:text-text-dark-secondary">Sub Category</th>
                                        <th className="px-3 py-2 text-left font-medium text-text-light-secondary dark:text-text-dark-secondary">Date</th>
                                        <th className="px-3 py-2 text-left font-medium text-text-light-secondary dark:text-text-dark-secondary">Note</th>
                                        <th className="px-3 py-2 text-left font-medium text-text-light-secondary dark:text-text-dark-secondary">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {validatedRows.map((vrow, i) => (
                                        <tr
                                            key={i}
                                            className={
                                                vrow.isValid
                                                    ? 'border-b border-border-light-primary dark:border-border-dark-primary hover:bg-green-500/5'
                                                    : 'border-b border-border-light-primary dark:border-border-dark-primary bg-red-500/10 hover:bg-red-500/15'
                                            }
                                        >
                                            <td className="px-3 py-2 text-text-light-secondary dark:text-text-dark-secondary">{i + 1}</td>
                                            <td className="px-3 py-2 font-mono">{vrow.raw.type || <span className="text-red-400 italic">empty</span>}</td>
                                            <td className="px-3 py-2">{vrow.raw.amount || <span className="text-red-400 italic">empty</span>}</td>
                                            <td className="px-3 py-2">{vrow.raw.spaceName || <span className="text-red-400 italic">empty</span>}</td>
                                            <td className="px-3 py-2 text-text-light-secondary dark:text-text-dark-secondary">{vrow.raw.fromSpaceName || '—'}</td>
                                            <td className="px-3 py-2 text-text-light-secondary dark:text-text-dark-secondary">{vrow.raw.toSpaceName || '—'}</td>
                                            <td className="px-3 py-2">{vrow.raw.pcategoryName || <span className="text-red-400 italic">empty</span>}</td>
                                            <td className="px-3 py-2">{vrow.raw.scategoryName || <span className="text-red-400 italic">empty</span>}</td>
                                            <td className="px-3 py-2">{vrow.raw.date || <span className="text-red-400 italic">empty</span>}</td>
                                            <td className="px-3 py-2 max-w-[120px] truncate text-text-light-secondary dark:text-text-dark-secondary">{vrow.raw.note || '—'}</td>
                                            <td className="px-3 py-2 min-w-[160px]">
                                                {vrow.isValid ? (
                                                    <span className="flex items-center gap-1 text-green-400">
                                                        <FaCheckCircle size={11} /> Valid
                                                    </span>
                                                ) : (
                                                    <span className="flex items-start gap-1 text-red-400">
                                                        <FaExclamationCircle size={11} className="mt-0.5 shrink-0" />
                                                        <span>{vrow.errors.join(' · ')}</span>
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-border-light-primary dark:border-border-dark-primary shrink-0">
                            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                {invalidCount > 0 && 'Only valid rows will be imported.'}
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    text="Cancel"
                                    className="max-w-fit"
                                    priority="secondary"
                                    onClick={onClose}
                                />
                                <Button
                                    text={importing ? 'Importing...' : `Import ${validCount} row${validCount !== 1 ? 's' : ''}`}
                                    className="max-w-fit"
                                    disabled={validCount === 0 || importing}
                                    onClick={handleImport}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
