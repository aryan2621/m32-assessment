import { generateContentCreative } from '../config/gemini';
import Expense from '../models/Expense';

interface ExpenseStats {
    totalExpenses: number;
    expenseCount: number;
    byCategory: Record<string, number>;
    byVendor: Record<string, number>;
    averageExpense: number;
}

interface ChartData {
    monthlyTrends: Array<{
        month: string;
        amount: number;
    }>;
}

interface AnalyticsResult {
    stats: ExpenseStats;
    insights: string;
    chartData: ChartData;
}

export const generateAnalytics = async (
    userRequest: string,
    userId: string
): Promise<AnalyticsResult> => {
    try {
        const expenses = await Expense.find({ userId }).lean();

        const stats = calculateStats(expenses);

        const insights = await generateInsights(stats, userRequest);

        const chartData = prepareChartData(expenses);

        return {
            stats,
            insights,
            chartData,
        };
    } catch (error) {
        throw new Error(`Failed to generate analytics: ${error}`);
    }
};

function calculateStats(expenses: any[]): ExpenseStats {
    const total = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const byCategory: Record<string, number> = {};
    const byVendor: Record<string, number> = {};

    expenses.forEach((exp) => {
        const category = exp.category || 'uncategorized';
        byCategory[category] = (byCategory[category] || 0) + (exp.amount || 0);

        if (exp.vendor) {
            byVendor[exp.vendor] = (byVendor[exp.vendor] || 0) + (exp.amount || 0);
        }
    });

    return {
        totalExpenses: total,
        expenseCount: expenses.length,
        byCategory,
        byVendor,
        averageExpense: expenses.length > 0 ? total / expenses.length : 0,
    };
}

async function generateInsights(stats: ExpenseStats, userRequest: string): Promise<string> {
    const prompt = `
Based on these expense statistics, provide 3-4 actionable insights:

${JSON.stringify(stats, null, 2)}

User asked: "${userRequest}"

Provide insights that are:
1. Specific and data-driven
2. Actionable
3. Relevant to small business owners
4. Easy to understand

Format as bullet points.
`;

    try {
        const response = await generateContentCreative(prompt);
        return response;
    } catch (error) {
        return 'Unable to generate insights at this time.';
    }
}

function prepareChartData(expenses: any[]): ChartData {
    const byMonth: Record<string, number> = {};

    expenses.forEach((exp) => {
        if (exp.date) {
            const month = new Date(exp.date).toISOString().slice(0, 7);
            byMonth[month] = (byMonth[month] || 0) + (exp.amount || 0);
        }
    });

    return {
        monthlyTrends: Object.entries(byMonth).map(([month, amount]) => ({
            month,
            amount,
        })),
    };
}
