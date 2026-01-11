import { utils, writeFile } from 'xlsx';
import { Expense } from '../types/expense';

export const exportToExcel = (expenses: Expense[], filename = 'expenses.xlsx') => {
    // Format data for Excel
    const data = expenses.map(expense => ({
        Date: expense.date,
        Category: expense.category,
        Amount: Number(expense.amount), // Ensure number
        Note: expense.note || '',
        'Created At': new Date(expense.createdAt).toLocaleString(),
    }));

    // Create worksheet
    const ws = utils.json_to_sheet(data);

    // Set column widths
    const wscols = [
        { wch: 15 }, // Date
        { wch: 15 }, // Category
        { wch: 12 }, // Amount
        { wch: 30 }, // Note
        { wch: 25 }, // Created At
    ];
    ws['!cols'] = wscols;

    // Create workbook
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Expenses');

    // Trigger download
    writeFile(wb, filename);
};
