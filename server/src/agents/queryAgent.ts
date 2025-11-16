import { generateContent } from '../config/gemini';
import Expense from '../models/Expense';

interface MongoQuery {
    userId: string;
    amount?: { $gt?: number; $lt?: number; $gte?: number; $lte?: number };
    currency?: string;
    category?: string | { $in?: string[] };
    vendor?: string | { $regex?: string; $options?: string };
    description?: { $regex?: string; $options?: string };
    date?: {
        $gte?: Date | string;
        $lte?: Date | string;
        $gt?: Date | string;
        $lt?: Date | string;
    };
}

export const queryExpenses = async (userQuery: string, userId: string): Promise<string> => {
    try {
        const mongoQuery = await convertToMongoQuery(userQuery, userId);

        const results = await Expense.find(mongoQuery).sort({ date: -1 }).lean();

        return formatQueryResults(results);
    } catch (error) {
        throw new Error(`Failed to query expenses: ${error}`);
    }
};

async function convertToMongoQuery(userQuery: string, userId: string): Promise<MongoQuery> {
    const prompt = `
Convert this natural language query to MongoDB query filters:

"${userQuery}"

User ID: ${userId}

Available fields: userId, amount, currency, category, vendor, description, date

Return a JSON object with MongoDB query filters. Always include userId.

Examples:
- "Show March expenses" → {"userId": "...", "date": {"$gte": "2024-03-01", "$lte": "2024-03-31"}}
- "Expenses over 1000" → {"userId": "...", "amount": {"$gt": 1000}}
- "Software category" → {"userId": "...", "category": "software"}

Return ONLY valid JSON.
`;

    try {
        const content = await generateContent(prompt, { temperature: 0.3 });
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const queryJson = jsonMatch ? jsonMatch[0] : content;
        const query: MongoQuery = JSON.parse(queryJson);

        query.userId = userId;

        if (query.date) {
            if (typeof query.date.$gte === 'string') {
                query.date.$gte = new Date(query.date.$gte);
            }
            if (typeof query.date.$lte === 'string') {
                query.date.$lte = new Date(query.date.$lte);
            }
            if (typeof query.date.$gt === 'string') {
                query.date.$gt = new Date(query.date.$gt);
            }
            if (typeof query.date.$lt === 'string') {
                query.date.$lt = new Date(query.date.$lt);
            }
        }

        return query;
    } catch (error) {
        throw new Error(`Failed to convert query to MongoDB format: ${error}`);
    }
}

function formatQueryResults(results: any[]): string {
    if (results.length === 0) {
        return "I couldn't find any expenses matching your query.";
    }

    const total = results.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const count = results.length;

    let response = `Found ${count} expense${count > 1 ? 's' : ''}:\n\n`;

    results.slice(0, 10).forEach((exp) => {
        const vendor = exp.vendor || 'Unknown vendor';
        const amount = exp.amount?.toLocaleString() || '0';
        const category = exp.category || 'uncategorized';
        response += `• ${vendor} - ₹${amount} (${category})\n`;
    });

    response += `\nTotal: ₹${total.toLocaleString()}`;

    if (results.length > 10) {
        response += `\n\n(Showing first 10 of ${results.length} results)`;
    }

    return response;
}
