import { z } from 'zod';
import { queryExpenses } from './queryAgent';
import { generateAnalytics } from './analyticsAgent';
import Invoice from '../models/Invoice';
import Expense from '../models/Expense';
import { processInvoice } from './invoiceAgent';
import { uploadFile } from '../services/supabaseService';
import { logger } from '../utils/logger';
import { generateContent } from '../config/gemini';
import { DynamicStructuredTool } from 'langchain';
import {
    saveMemory,
    searchMemories,
    getMemoryByKey,
    deleteMemoryByKey,
} from '../services/memoryService';

export const createTools = (userId: string) => {
    const queryExpensesTool = new DynamicStructuredTool({
        name: 'query_expenses',
        description: `Query and search expenses based on natural language criteria. Use this when users ask about expenses, spending, costs, or want to find specific expenses by date, vendor, category, or amount. Examples: "Show March expenses", "Find expenses over 1000", "What did I spend on software?"`,
        schema: z.object({
            query: z
                .string()
                .describe('The natural language query describing what expenses to find'),
        }),
        func: async ({ query }: { query: string }) => {
            try {
                return await queryExpenses(query, userId);
            } catch (error: any) {
                return `Error querying expenses: ${error.message}`;
            }
        },
    });

    const generateAnalyticsTool = new DynamicStructuredTool({
        name: 'generate_analytics',
        description: `Generate expense analytics, insights, reports, statistics, or trends. Use this when users ask for analytics, insights, reports, statistics, trends, or want to understand their spending patterns. Examples: "Show me analytics", "What are my spending trends?", "Generate a report"`,
        schema: z.object({
            request: z.string().describe("The user's request for analytics or insights"),
        }),
        func: async ({ request }: { request: string }) => {
            try {
                const analytics = await generateAnalytics(request, userId);
                return `Analytics Results:\n\nTotal Expenses: ${analytics.stats.totalExpenses.toLocaleString()}\nExpense Count: ${analytics.stats.expenseCount}\nAverage Expense: ${analytics.stats.averageExpense.toLocaleString()}\n\nInsights:\n${analytics.insights}`;
            } catch (error: any) {
                return `Error generating analytics: ${error.message}`;
            }
        },
    });

    const getInvoicesTool = new DynamicStructuredTool({
        name: 'get_invoices',
        description: `Get list of invoices. Use this when users ask to see invoices, list invoices, or view invoice information. Can filter by status, category, date range, or search by vendor/invoice number.`,
        schema: z.object({
            status: z.string().optional().describe('Filter by status: pending, paid, or overdue'),
            category: z
                .string()
                .optional()
                .describe('Filter by category: utilities, software, office, marketing, other'),
            search: z.string().optional().describe('Search by vendor name or invoice number'),
            limit: z
                .number()
                .optional()
                .describe('Maximum number of invoices to return (default: 10)'),
        }),
        func: async ({
            status,
            category,
            search,
            limit = 10,
        }: {
            status: string;
            category: string;
            search: string;
            limit: number;
        }) => {
            try {
                const query: any = { userId };
                if (status) query.status = status;
                if (category) query.category = category;
                if (search) {
                    query.$or = [
                        { vendorName: { $regex: search, $options: 'i' } },
                        { invoiceNumber: { $regex: search, $options: 'i' } },
                    ];
                }

                const invoices = await Invoice.find(query)
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .lean();

                if (invoices.length === 0) {
                    return 'No invoices found matching your criteria.';
                }

                let response = `Found ${invoices.length} invoice${invoices.length > 1 ? 's' : ''}:\n\n`;
                invoices.forEach((inv: any) => {
                    const vendor = inv.vendorName || 'Unknown';
                    const amount = inv.totalAmount?.toLocaleString() || '0';
                    const invDate = inv.invoiceDate
                        ? new Date(inv.invoiceDate).toLocaleDateString()
                        : 'N/A';
                    response += `• ${vendor} - ${inv.currency || 'INR'} ${amount} (${inv.status || 'pending'}) - ${invDate}\n`;
                    if (inv.invoiceNumber) {
                        response += `  Invoice #: ${inv.invoiceNumber}\n`;
                    }
                });

                return response;
            } catch (error: any) {
                return `Error fetching invoices: ${error.message}`;
            }
        },
    });

    const getInvoiceByIdTool = new DynamicStructuredTool({
        name: 'get_invoice_details',
        description: `Get detailed information about a specific invoice by ID or invoice number. Use this when users ask for details about a specific invoice.`,
        schema: z.object({
            identifier: z.string().describe('Invoice ID or invoice number'),
        }),
        func: async ({ identifier }: { identifier: string }) => {
            try {
                let invoice;
                if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
                    invoice = await Invoice.findOne({ _id: identifier, userId }).lean();
                } else {
                    invoice = await Invoice.findOne({ invoiceNumber: identifier, userId }).lean();
                }

                if (!invoice) {
                    return `Invoice not found with identifier: ${identifier}`;
                }

                const inv: any = invoice;
                let response = `Invoice Details:\n\n`;
                response += `Vendor: ${inv.vendorName || 'N/A'}\n`;
                response += `Invoice Number: ${inv.invoiceNumber || 'N/A'}\n`;
                response += `Date: ${inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : 'N/A'}\n`;
                response += `Due Date: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}\n`;
                response += `Amount: ${inv.currency || 'INR'} ${inv.totalAmount?.toLocaleString() || '0'}\n`;
                response += `Status: ${inv.status || 'pending'}\n`;
                response += `Category: ${inv.category || 'other'}\n`;

                if (inv.items && inv.items.length > 0) {
                    response += `\nItems:\n`;
                    inv.items.forEach((item: any, idx: number) => {
                        response += `${idx + 1}. ${item.description || 'N/A'} - Qty: ${item.quantity || 0} x ${item.unitPrice || 0} = ${item.amount || 0}\n`;
                    });
                }

                return response;
            } catch (error: any) {
                return `Error fetching invoice details: ${error.message}`;
            }
        },
    });

    const detectDuplicatesTool = new DynamicStructuredTool({
        name: 'detect_duplicate_invoices',
        description: `Detect potential duplicate invoices using AI-powered similarity analysis. Use this when users ask about duplicates, similar invoices, or want to check for duplicate payments.`,
        schema: z.object({
            threshold: z.number().optional().describe('Similarity threshold (0-1, default: 0.85)'),
        }),
        func: async ({ threshold = 0.85 }) => {
            try {
                const invoices = await Invoice.find({ userId, isProcessed: true }).lean();

                if (invoices.length < 2) {
                    return 'Not enough invoices to check for duplicates.';
                }

                const duplicates: Array<{
                    invoice1: any;
                    invoice2: any;
                    similarity: number;
                    reason: string;
                }> = [];

                for (let i = 0; i < invoices.length; i++) {
                    for (let j = i + 1; j < invoices.length; j++) {
                        const inv1: any = invoices[i];
                        const inv2: any = invoices[j];

                        let similarity = 0;
                        let reasons: string[] = [];

                        if (
                            inv1.invoiceNumber &&
                            inv2.invoiceNumber &&
                            inv1.invoiceNumber === inv2.invoiceNumber
                        ) {
                            similarity += 0.4;
                            reasons.push('same invoice number');
                        }

                        if (
                            inv1.vendorName &&
                            inv2.vendorName &&
                            inv1.vendorName.toLowerCase() === inv2.vendorName.toLowerCase()
                        ) {
                            similarity += 0.2;
                            reasons.push('same vendor');
                        }

                        if (inv1.totalAmount && inv2.totalAmount) {
                            const amountDiff = Math.abs(inv1.totalAmount - inv2.totalAmount);
                            const avgAmount = (inv1.totalAmount + inv2.totalAmount) / 2;
                            if (amountDiff / avgAmount < 0.01) {
                                similarity += 0.3;
                                reasons.push('same amount');
                            }
                        }

                        if (inv1.invoiceDate && inv2.invoiceDate) {
                            const date1 = new Date(inv1.invoiceDate);
                            const date2 = new Date(inv2.invoiceDate);
                            const daysDiff = Math.abs(
                                (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
                            );
                            if (daysDiff < 7) {
                                similarity += 0.1;
                                reasons.push('similar date');
                            }
                        }

                        if (similarity >= 0.5 && similarity < threshold) {
                            try {
                                const aiPrompt = `Compare these two invoices and determine if they are duplicates or very similar. Return a JSON object with "similarity" (0-1) and "reason" (brief explanation).

Invoice 1:
- Vendor: ${inv1.vendorName || 'N/A'}
- Invoice Number: ${inv1.invoiceNumber || 'N/A'}
- Amount: ${inv1.totalAmount || 'N/A'}
- Date: ${inv1.invoiceDate ? new Date(inv1.invoiceDate).toISOString() : 'N/A'}

Invoice 2:
- Vendor: ${inv2.vendorName || 'N/A'}
- Invoice Number: ${inv2.invoiceNumber || 'N/A'}
- Amount: ${inv2.totalAmount || 'N/A'}
- Date: ${inv2.invoiceDate ? new Date(inv2.invoiceDate).toISOString() : 'N/A'}

Return ONLY valid JSON: {"similarity": 0.0-1.0, "reason": "explanation"}`;

                                const aiResponse = await generateContent(aiPrompt, {
                                    temperature: 0.1,
                                });
                                const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
                                if (jsonMatch) {
                                    const aiAnalysis = JSON.parse(jsonMatch[0]);
                                    if (
                                        aiAnalysis.similarity &&
                                        aiAnalysis.similarity >= threshold
                                    ) {
                                        similarity = aiAnalysis.similarity;
                                        reasons.push(
                                            `AI analysis: ${aiAnalysis.reason || 'similar invoices'}`
                                        );
                                    }
                                }
                            } catch (aiError) {
                            }
                        }

                        if (similarity >= threshold) {
                            duplicates.push({
                                invoice1: inv1,
                                invoice2: inv2,
                                similarity,
                                reason: reasons.join(', '),
                            });
                        }
                    }
                }

                if (duplicates.length === 0) {
                    return 'No duplicate invoices detected.';
                }

                let response = `Found ${duplicates.length} potential duplicate${duplicates.length > 1 ? 's' : ''}:\n\n`;
                duplicates.forEach((dup, idx) => {
                    response += `${idx + 1}. Similarity: ${(dup.similarity * 100).toFixed(0)}%\n`;
                    response += `   Invoice 1: ${dup.invoice1.vendorName || 'Unknown'} - ${dup.invoice1.invoiceNumber || 'N/A'} - ${dup.invoice1.totalAmount || 0}\n`;
                    response += `   Invoice 2: ${dup.invoice2.vendorName || 'Unknown'} - ${dup.invoice2.invoiceNumber || 'N/A'} - ${dup.invoice2.totalAmount || 0}\n`;
                    response += `   Reason: ${dup.reason}\n\n`;
                });

                return response;
            } catch (error: any) {
                return `Error detecting duplicates: ${error.message}`;
            }
        },
    });

    const generateReportTool = new DynamicStructuredTool({
        name: 'generate_expense_report',
        description: `Generate a comprehensive expense report in text format. Use this when users ask for reports, summaries, or detailed expense breakdowns. The report includes statistics, insights, and analysis.`,
        schema: z.object({
            format: z
                .enum(['text', 'summary'])
                .optional()
                .describe('Report format: text (detailed) or summary (brief)'),
            startDate: z.string().optional().describe('Start date for report (YYYY-MM-DD)'),
            endDate: z.string().optional().describe('End date for report (YYYY-MM-DD)'),
        }),
        func: async ({
            format = 'text',
            startDate,
            endDate,
        }: {
            format: string;
            startDate: string;
            endDate: string;
        }) => {
            try {
                let query: any = { userId };
                if (startDate || endDate) {
                    query.date = {};
                    if (startDate) {
                        query.date.$gte = new Date(startDate);
                    }
                    if (endDate) {
                        query.date.$lte = new Date(endDate);
                    }
                }

                const expenses = await Expense.find(query).lean();
                const invoices = await Invoice.find({ userId }).lean();

                if (expenses.length === 0 && invoices.length === 0) {
                    return 'No expenses or invoices found for the specified period.';
                }

                const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                const totalInvoices = invoices.reduce(
                    (sum, inv: any) => sum + (inv.totalAmount || 0),
                    0
                );

                const byCategory: Record<string, number> = {};
                const byVendor: Record<string, number> = {};

                expenses.forEach((exp) => {
                    const category = exp.category || 'uncategorized';
                    byCategory[category] = (byCategory[category] || 0) + (exp.amount || 0);
                    if (exp.vendor) {
                        byVendor[exp.vendor] = (byVendor[exp.vendor] || 0) + (exp.amount || 0);
                    }
                });

                invoices.forEach((inv: any) => {
                    if (inv.vendorName && inv.totalAmount) {
                        byVendor[inv.vendorName] =
                            (byVendor[inv.vendorName] || 0) + inv.totalAmount;
                    }
                });

                const topVendors = Object.entries(byVendor)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5);

                const analytics = await generateAnalytics(
                    'Generate comprehensive expense report',
                    userId
                );

                let report = `EXPENSE REPORT\n`;
                report += `Generated: ${new Date().toLocaleDateString()}\n`;
                if (startDate || endDate) {
                    report += `Period: ${startDate || 'All time'} to ${endDate || 'Present'}\n`;
                }
                report += `\n=== SUMMARY ===\n`;
                report += `Total Expenses: ${totalExpenses.toLocaleString()}\n`;
                report += `Total Invoices: ${totalInvoices.toLocaleString()}\n`;
                report += `Expense Count: ${expenses.length}\n`;
                report += `Invoice Count: ${invoices.length}\n`;
                report += `Average Expense: ${expenses.length > 0 ? (totalExpenses / expenses.length).toLocaleString() : '0'}\n`;

                if (Object.keys(byCategory).length > 0) {
                    report += `\n=== BY CATEGORY ===\n`;
                    Object.entries(byCategory)
                        .sort(([, a], [, b]) => b - a)
                        .forEach(([category, amount]) => {
                            report += `${category}: ${amount.toLocaleString()}\n`;
                        });
                }

                if (topVendors.length > 0) {
                    report += `\n=== TOP VENDORS ===\n`;
                    topVendors.forEach(([vendor, amount], idx) => {
                        report += `${idx + 1}. ${vendor}: ${amount.toLocaleString()}\n`;
                    });
                }

                report += `\n=== INSIGHTS ===\n${analytics.insights}\n`;

                if (format === 'text' && expenses.length > 0) {
                    report += `\n=== RECENT EXPENSES (Last 10) ===\n`;
                    expenses
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 10)
                        .forEach((exp) => {
                            const date = new Date(exp.date).toLocaleDateString();
                            report += `${date} - ${exp.vendor || 'Unknown'}: ${exp.amount?.toLocaleString() || '0'} (${exp.category || 'uncategorized'})\n`;
                        });
                }

                return report;
            } catch (error: any) {
                return `Error generating report: ${error.message}`;
            }
        },
    });

    const exportCSVReportTool = new DynamicStructuredTool({
        name: 'export_csv_report',
        description: `Generate a CSV export of expenses. Use this when users ask to export data, download CSV, or get data in spreadsheet format. Returns CSV data that can be saved to a file.`,
        schema: z.object({
            startDate: z.string().optional().describe('Start date for export (YYYY-MM-DD)'),
            endDate: z.string().optional().describe('End date for export (YYYY-MM-DD)'),
        }),
        func: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
            try {
                let query: any = { userId };
                if (startDate || endDate) {
                    query.date = {};
                    if (startDate) {
                        query.date.$gte = new Date(startDate);
                    }
                    if (endDate) {
                        query.date.$lte = new Date(endDate);
                    }
                }

                const expenses = await Expense.find(query).sort({ date: -1 }).lean();

                if (expenses.length === 0) {
                    return 'No expenses found for the specified period.';
                }

                const csvHeader = 'Date,Amount,Currency,Category,Vendor,Description\n';
                const csvRows = expenses
                    .map((exp) => {
                        const date = exp.date ? new Date(exp.date).toISOString().split('T')[0] : '';
                        const amount = exp.amount || 0;
                        const currency = exp.currency || 'INR';
                        const category = exp.category || '';
                        const vendor = String(exp.vendor || '')
                            .replace(/,/g, ';')
                            .replace(/\n/g, ' ');
                        const description = String(exp.description || '')
                            .replace(/,/g, ';')
                            .replace(/\n/g, ' ');
                        return `${date},${amount},${currency},${category},${vendor},${description}`;
                    })
                    .join('\n');

                const csv = csvHeader + csvRows;

                return `CSV Export (${expenses.length} expenses):\n\n${csv}\n\nYou can copy this data and save it as a .csv file.`;
            } catch (error: any) {
                return `Error exporting CSV: ${error.message}`;
            }
        },
    });

    const processInvoiceFromTextTool = new DynamicStructuredTool({
        name: 'process_invoice_from_text',
        description: `Process invoice data from text content or a file URL. Use this when users upload invoice documents, provide invoice text, or want to extract invoice information from text. This will create a new invoice record in the system.`,
        schema: z.object({
            invoiceText: z
                .string()
                .optional()
                .describe('The text content of the invoice to process'),
            fileUrl: z.string().optional().describe('URL of an uploaded invoice file to process'),
            fileName: z.string().optional().describe('Name of the invoice file'),
        }),
        func: async ({
            invoiceText,
            fileUrl,
            fileName,
        }: {
            invoiceText: string;
            fileUrl: string;
            fileName: string;
        }) => {
            try {
                if (!invoiceText && !fileUrl) {
                    return 'Error: Either invoiceText or fileUrl must be provided.';
                }

                let fileBuffer: Buffer | null = null;
                let fileType: 'pdf' | 'image' = 'pdf';
                let mimeType = 'application/pdf';

                if (fileUrl) {
                    try {
                        const response = await fetch(fileUrl);
                        if (!response.ok) {
                            return `Error: Could not fetch file from URL: ${response.statusText}`;
                        }
                        const arrayBuffer = await response.arrayBuffer();
                        fileBuffer = Buffer.from(arrayBuffer);
                        mimeType = response.headers.get('content-type') || 'application/pdf';
                        fileType = mimeType.includes('pdf') ? 'pdf' : 'image';
                    } catch (fetchError: any) {
                        return `Error fetching file: ${fetchError.message}`;
                    }
                }

                if (invoiceText && !fileBuffer) {
                    return 'Error: Invoice text processing requires file upload. Please upload the invoice file first, then ask me to process it.';
                }

                if (!fileBuffer) {
                    return 'Error: No file data available to process.';
                }

                const extractedData = await processInvoice(fileBuffer, fileType, mimeType);

                const { url } = await uploadFile(fileBuffer, fileName || 'invoice.pdf', mimeType);

                const invoice = await Invoice.create({
                    userId,
                    fileUrl: url,
                    fileName: fileName || 'invoice.pdf',
                    fileType,
                    vendorName: extractedData?.vendorName || undefined,
                    vendorEmail: extractedData?.vendorEmail || undefined,
                    vendorPhone: extractedData?.vendorPhone || undefined,
                    invoiceNumber: extractedData?.invoiceNumber || undefined,
                    invoiceDate: extractedData?.invoiceDate
                        ? new Date(extractedData.invoiceDate)
                        : undefined,
                    dueDate: extractedData?.dueDate ? new Date(extractedData.dueDate) : undefined,
                    totalAmount: extractedData?.totalAmount || undefined,
                    currency: extractedData?.currency || 'INR',
                    taxAmount: extractedData?.taxAmount || undefined,
                    subtotal: extractedData?.subtotal || undefined,
                    items: extractedData?.items || [],
                    category: 'other',
                    status: 'pending',
                    isProcessed: true,
                });

                if (extractedData && invoice.totalAmount) {
                    await Expense.create({
                        userId,
                        invoiceId: invoice._id,
                        amount: invoice.totalAmount,
                        currency: invoice.currency,
                        category: invoice.category,
                        vendor: invoice.vendorName,
                        description: `Invoice ${invoice.invoiceNumber || 'N/A'}`,
                        date: invoice.invoiceDate || new Date(),
                    });
                }

                let response = `Invoice processed successfully!\n\n`;
                response += `Vendor: ${invoice.vendorName || 'N/A'}\n`;
                response += `Invoice Number: ${invoice.invoiceNumber || 'N/A'}\n`;
                response += `Date: ${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}\n`;
                response += `Amount: ${invoice.currency || 'INR'} ${invoice.totalAmount?.toLocaleString() || '0'}\n`;
                response += `Status: ${invoice.status}\n`;
                response += `\nInvoice ID: ${invoice._id}`;

                return response;
            } catch (error: any) {
                logger.error('Error processing invoice from text/URL', { error: error.message });
                return `Error processing invoice: ${error.message}`;
            }
        },
    });

    const updateInvoiceStatusTool = new DynamicStructuredTool({
        name: 'update_invoice_status',
        description: `Update the status of an invoice. Use this when users want to mark invoices as paid, pending, or overdue. Can also update payment method and notes. Examples: "Mark invoice INV-001 as paid", "Update invoice status to paid", "Set payment method for invoice 123"`,
        schema: z.object({
            identifier: z.string().describe('Invoice ID or invoice number'),
            status: z
                .enum(['pending', 'paid', 'overdue'])
                .describe('New status for the invoice'),
            paymentMethod: z
                .string()
                .optional()
                .describe('Payment method used (e.g., "Credit Card", "Bank Transfer", "Cash")'),
            notes: z.string().optional().describe('Additional notes about the payment or status change'),
        }),
        func: async ({
            identifier,
            status,
            paymentMethod,
            notes,
        }: {
            identifier: string;
            status: 'pending' | 'paid' | 'overdue';
            paymentMethod?: string;
            notes?: string;
        }) => {
            try {
                let invoice;
                if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
                    invoice = await Invoice.findOne({ _id: identifier, userId });
                } else {
                    invoice = await Invoice.findOne({ invoiceNumber: identifier, userId });
                }

                if (!invoice) {
                    return `Invoice not found with identifier: ${identifier}`;
                }

                const updateData: any = { status };
                if (paymentMethod) {
                    updateData.paymentMethod = paymentMethod;
                }
                if (notes) {
                    updateData.notes = notes;
                }

                const updatedInvoice = await Invoice.findByIdAndUpdate(
                    invoice._id,
                    updateData,
                    { new: true }
                ).lean();

                const inv: any = updatedInvoice;
                let response = `Invoice status updated successfully!\n\n`;
                response += `Invoice: ${inv.vendorName || 'Unknown'} - ${inv.invoiceNumber || 'N/A'}\n`;
                response += `Status: ${inv.status}\n`;
                if (inv.paymentMethod) {
                    response += `Payment Method: ${inv.paymentMethod}\n`;
                }
                if (inv.notes) {
                    response += `Notes: ${inv.notes}\n`;
                }
                response += `Amount: ${inv.currency || 'INR'} ${inv.totalAmount?.toLocaleString() || '0'}\n`;

                return response;
            } catch (error: any) {
                logger.error('Error updating invoice status', { error: error.message });
                return `Error updating invoice status: ${error.message}`;
            }
        },
    });

    const updateExpenseCategoryTool = new DynamicStructuredTool({
        name: 'update_expense_category',
        description: `Update the category of an expense. Use this when users want to change expense categories or recategorize expenses. Examples: "Change expense category to software", "Recategorize expense 123 as marketing"`,
        schema: z.object({
            expenseId: z.string().describe('Expense ID'),
            category: z
                .string()
                .describe('New category for the expense (e.g., utilities, software, office, marketing, other)'),
        }),
        func: async ({ expenseId, category }: { expenseId: string; category: string }) => {
            try {
                const expense = await Expense.findOne({ _id: expenseId, userId });

                if (!expense) {
                    return `Expense not found with ID: ${expenseId}`;
                }

                expense.category = category;
                await expense.save();

                return `Expense category updated successfully!\n\nExpense ID: ${expense._id}\nVendor: ${expense.vendor || 'N/A'}\nAmount: ${expense.currency || 'INR'} ${expense.amount?.toLocaleString() || '0'}\nNew Category: ${category}`;
            } catch (error: any) {
                logger.error('Error updating expense category', { error: error.message });
                return `Error updating expense category: ${error.message}`;
            }
        },
    });

    const saveMemoryTool = new DynamicStructuredTool({
        name: 'save_memory',
        description: `Save important information about the user to memory. Use this when users share personal information like their name, preferences, or any details you should remember for future conversations. Examples: user says "my name is John", "I prefer monthly reports", "I work in finance".`,
        schema: z.object({
            key: z.string().describe('A unique key/identifier for this memory (e.g., "name", "preference_report_frequency")'),
            value: z.string().describe('The actual information to remember'),
            description: z.string().optional().describe('Optional description or context for this memory'),
            type: z.string().optional().describe('Type of memory: personal_info, preference, fact, etc.'),
        }),
        func: async ({
            key,
            value,
            description,
            type,
        }: {
            key: string;
            value: string;
            description?: string;
            type?: string;
        }) => {
            try {
                await saveMemory(userId, { key, value, description, type });
                return `Memory saved successfully: ${key} = ${value}`;
            } catch (error: any) {
                logger.error('Error saving memory via tool', { userId, error: error.message });
                return `Error saving memory: ${error.message}`;
            }
        },
    });

    const searchMemoryTool = new DynamicStructuredTool({
        name: 'search_memory',
        description: `Search for relevant information stored in memory. Use this when you need to recall something about the user or find related information. Examples: "What is the user's name?", "What are the user's preferences?", "What did the user tell me about X?"`,
        schema: z.object({
            query: z.string().describe('The search query to find relevant memories'),
            limit: z.number().optional().describe('Maximum number of results to return (default: 5)'),
        }),
        func: async ({ query, limit = 5 }: { query: string; limit?: number }) => {
            try {
                const memories = await searchMemories(userId, query, limit);
                if (memories.length === 0) {
                    return 'No relevant memories found.';
                }
                return `Found ${memories.length} relevant memory/memories:\n\n${memories.map((mem, idx) => `${idx + 1}. ${mem.text}`).join('\n')}`;
            } catch (error: any) {
                logger.error('Error searching memory via tool', { userId, error: error.message });
                return `Error searching memory: ${error.message}`;
            }
        },
    });

    const getMemoryTool = new DynamicStructuredTool({
        name: 'get_memory',
        description: `Get a specific memory by its key. Use this when you know the exact key of the information you want to retrieve.`,
        schema: z.object({
            key: z.string().describe('The key of the memory to retrieve'),
        }),
        func: async ({ key }: { key: string }) => {
            try {
                const memory = await getMemoryByKey(userId, key);
                if (!memory) {
                    return `No memory found with key: ${key}`;
                }
                return `Memory (${key}): ${memory}`;
            } catch (error: any) {
                logger.error('Error getting memory via tool', { userId, key, error: error.message });
                return `Error getting memory: ${error.message}`;
            }
        },
    });

    const deleteMemoryTool = new DynamicStructuredTool({
        name: 'delete_memory',
        description: `Delete a specific memory by its key. Use this when the user asks to forget something or when information needs to be removed.`,
        schema: z.object({
            key: z.string().describe('The key of the memory to delete'),
        }),
        func: async ({ key }: { key: string }) => {
            try {
                await deleteMemoryByKey(userId, key);
                return `Memory deleted successfully: ${key}`;
            } catch (error: any) {
                logger.error('Error deleting memory via tool', { userId, key, error: error.message });
                return `Error deleting memory: ${error.message}`;
            }
        },
    });

    return [
        queryExpensesTool,
        generateAnalyticsTool,
        getInvoicesTool,
        getInvoiceByIdTool,
        detectDuplicatesTool,
        generateReportTool,
        exportCSVReportTool,
        processInvoiceFromTextTool,
        updateInvoiceStatusTool,
        updateExpenseCategoryTool,
        saveMemoryTool,
        searchMemoryTool,
        getMemoryTool,
        deleteMemoryTool,
    ];
};
