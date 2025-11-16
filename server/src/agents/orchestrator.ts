import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { config } from '../config/constants';
import { createTools } from './tools';
import { logger } from '../utils/logger';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from 'langchain';
import { loadRelevantMemories } from '../services/memoryService';

export const handleUserMessage = async (
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    userId: string
): Promise<string> => {
    try {
        const model = new ChatGoogleGenerativeAI({
            model: 'gemini-2.5-flash',
            temperature: 0.3,
            apiKey: config.geminiApiKey,
        });

        const tools = createTools(userId);
        const modelWithTools = model.bindTools(tools);

        const contextForMemory = `${userMessage}\n${conversationHistory.slice(-3).map(m => m.content).join('\n')}`;
        const relevantMemories = await loadRelevantMemories(userId, contextForMemory, 5);
        
        const memoryContext = relevantMemories
            ? `\n\n${relevantMemories}\nRemember and use this information when relevant to the conversation.`
            : '';

        const systemPrompt = `You are a helpful assistant for an Invoice & Expense Copilot application. 
You help users manage their invoices and expenses.${memoryContext}

Available capabilities:
- Query expenses by date, vendor, category, or amount
- Generate analytics and insights about spending
- Get invoice lists and details
- Detect duplicate invoices using AI-powered similarity analysis
- Process invoices from uploaded files or URLs
- Generate expense reports (text format)
- Export expense data as CSV
- Update invoice status (pending, paid, overdue) and payment information
- Update expense categories
- Save and retrieve user information in memory (use save_memory when users share personal info, preferences, or anything you should remember)

When users upload invoice files, they are automatically processed. You can help them understand the extracted data or answer questions about it.
Be concise, helpful, and use tools when appropriate to answer user queries. 
When users ask about expenses, invoices, analytics, reports, want to process invoices, or update invoice/expense information, use the appropriate tools.
When users share personal information (like their name, preferences, etc.), use the save_memory tool to remember it for future conversations.
For general questions or conversations, respond naturally without tools.`;

        const messages = [
            new SystemMessage(systemPrompt),
            ...conversationHistory.slice(-20).map((msg) => {
                if (msg.role === 'user') {
                    return new HumanMessage(msg.content);
                } else {
                    return new AIMessage(msg.content);
                }
            }),
            new HumanMessage(userMessage),
        ];

        logger.debug('Chat Orchestrator Request', {
            userId,
            userMessage,
            conversationHistoryLength: conversationHistory.length,
            messagesCount: messages.length,
            hasMemoryContext: !!memoryContext,
        });

        let response = await modelWithTools.invoke(messages);

        logger.debug('Chat Orchestrator Response', {
            hasToolCalls: !!(response.tool_calls && response.tool_calls.length > 0),
            toolCallsCount: response.tool_calls?.length || 0,
            toolCalls: response.tool_calls?.map((tc: any) => ({ name: tc.name, args: tc.args })) || [],
            responseContent: response.content,
        });
        let finalResponse = '';

        let maxIterations = 5;
        let iterations = 0;

        while (iterations < maxIterations) {
            iterations++;

            if (response.tool_calls && response.tool_calls.length > 0) {
                const toolResults = await Promise.all(
                    response.tool_calls.map(async (toolCall: any) => {
                        const tool = tools.find((t) => t.name === toolCall.name);
                        if (!tool) {
                            return `Tool ${toolCall.name} not found`;
                        }

                        logger.debug('Tool Execution', {
                            toolName: toolCall.name,
                            toolArgs: toolCall.args,
                        });

                        try {
                            const result = await tool.invoke(toolCall.args);
                            
                            logger.debug('Tool Result', {
                                toolName: toolCall.name,
                                result: typeof result === 'string' ? result.substring(0, 500) : result,
                            });

                            return result;
                        } catch (error: any) {
                            logger.error('Tool execution failed', {
                                toolName: toolCall.name,
                                toolArgs: toolCall.args,
                                error: error.message,
                            });
                            return `Error executing ${toolCall.name}: ${error.message}`;
                        }
                    })
                );

                messages.push(response);

                const toolMessages = response.tool_calls.map((toolCall: any, index: number) => {
                    return new ToolMessage({
                        content: String(toolResults[index]),
                        tool_call_id: toolCall.id || `call_${index}`,
                    });
                });

                messages.push(...toolMessages);

                response = await modelWithTools.invoke(messages);
            } else {
                finalResponse = response.content as string;
                break;
            }
        }

        if (!finalResponse && response.content) {
            finalResponse = response.content as string;
        }

        if (!finalResponse) {
            finalResponse = "I'm having trouble processing your request. Please try again.";
        }

        logger.debug('Chat Orchestrator Final Response', {
            userId,
            finalResponse,
            iterations,
        });

        return finalResponse;
    } catch (error: any) {
        logger.error('Error in LangChain orchestrator', {
            error: error.message,
            stack: error.stack,
        });
        return `I encountered an error processing your request: ${error.message}. Please try again.`;
    }
};
