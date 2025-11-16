import { createPartFromUri } from '@google/genai';
import { generateContentWithMultimodal, uploadFile, getFile } from '../config/gemini';
import { logger } from '../utils/logger';

export interface ExtractedInvoiceData {
    vendorName?: string | null;
    vendorEmail?: string | null;
    vendorPhone?: string | null;
    invoiceNumber?: string | null;
    invoiceDate?: string | null;
    dueDate?: string | null;
    totalAmount?: number | null;
    currency?: string | null;
    taxAmount?: number | null;
    subtotal?: number | null;
    items?: Array<{
        description?: string;
        quantity?: number;
        unitPrice?: number;
        amount?: number;
    }> | null;
}

const extractionPrompt = `
Extract invoice information from this document and return a JSON object.

Analyze the document carefully, including any tables, charts, or visual elements. Extract these fields:

- vendorName: Name of the vendor/company issuing the invoice
- vendorEmail: Email address of the vendor
- vendorPhone: Phone number of the vendor
- invoiceNumber: Invoice number or ID
- invoiceDate: Date of invoice in ISO format (YYYY-MM-DD)
- dueDate: Due date in ISO format (YYYY-MM-DD)
- totalAmount: Total amount as a number
- currency: Currency code (e.g., USD, INR, EUR)
- taxAmount: Tax amount as a number
- subtotal: Subtotal amount as a number
- items: Array of line items, each with description, quantity, unitPrice, and amount fields

Return ONLY valid JSON with these exact field names. If a field is not found, use null.

Example format:
{
  "vendorName": "Acme Corp",
  "vendorEmail": "billing@acme.com",
  "vendorPhone": "+1234567890",
  "invoiceNumber": "INV-001",
  "invoiceDate": "2025-01-15",
  "dueDate": "2025-02-15",
  "totalAmount": 1000,
  "currency": "USD",
  "taxAmount": 100,
  "subtotal": 900,
  "items": [
    {
      "description": "Service",
      "quantity": 1,
      "unitPrice": 900,
      "amount": 900
    }
  ]
}
`;

export type ProgressCallback = (event: { type: string; message: string; progress?: number }) => void;

export const processInvoice = async (
    fileBuffer: Buffer,
    fileType: 'pdf' | 'image',
    mimeType: string,
    onProgress?: ProgressCallback
): Promise<ExtractedInvoiceData> => {
    const startTime = Date.now();

    try {
        if (!fileBuffer || fileBuffer.length === 0) {
            throw new Error('No file provided for processing');
        }

        let finalMimeType: string;
        if (fileType === 'pdf') {
            finalMimeType = 'application/pdf';
        } else {
            finalMimeType = mimeType || 'image/jpeg';
        }

        let documentPart: any;

        if (fileBuffer.length > 20 * 1024 * 1024) {
            onProgress?.({ type: 'file_upload_start', message: 'Uploading large file to Gemini...', progress: 10 });

            const { Blob } = await import('buffer');
            const fileBlob = new Blob([fileBuffer], { type: finalMimeType });

            const file = await uploadFile(fileBlob, {
                displayName: `invoice.${fileType === 'pdf' ? 'pdf' : 'jpg'}`,
            });

            if (!file.name) {
                throw new Error('File upload failed: no file name returned');
            }

            onProgress?.({ type: 'file_upload_progress', message: 'Waiting for file processing...', progress: 30 });

            let fileStatus = await getFile(file.name);
            while (fileStatus.state === 'PROCESSING') {
                onProgress?.({ type: 'file_processing', message: 'File is being processed by Gemini...', progress: 40 });
                await new Promise((resolve) => setTimeout(resolve, 5000));
                fileStatus = await getFile(file.name);
            }

            if (fileStatus.state === 'FAILED') {
                throw new Error('File processing failed');
            }

            onProgress?.({ type: 'file_upload_complete', message: 'File uploaded successfully', progress: 50 });

            if (file.uri && file.mimeType) {
                documentPart = createPartFromUri(file.uri, file.mimeType);
            } else {
                throw new Error('File upload failed: no URI or mimeType returned');
            }
        } else {
            onProgress?.({ type: 'preparing_document', message: 'Preparing document for processing...', progress: 20 });

            const base64Data = fileBuffer.toString('base64');

            documentPart = {
                inlineData: {
                    mimeType: finalMimeType,
                    data: base64Data,
                },
            };
        }

        onProgress?.({ type: 'ai_processing', message: 'Analyzing document with AI...', progress: 60 });

        const contents = [documentPart, { text: extractionPrompt }];

        logger.debug('Invoice AI Request', {
            fileType,
            fileSize: fileBuffer.length,
            mimeType: finalMimeType,
            promptLength: extractionPrompt.length,
        });

        const responseText = await generateContentWithMultimodal(contents, {
            temperature: 0.1,
        });

        logger.debug('Invoice AI Response', {
            responseLength: responseText.length,
            responsePreview: responseText.substring(0, 500),
        });

        onProgress?.({ type: 'ai_complete', message: 'AI analysis complete', progress: 80 });

        let extractedData: ExtractedInvoiceData;

        try {
            const content = responseText;

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                extractedData = JSON.parse(jsonMatch[0]);
            } else {
                extractedData = JSON.parse(content);
            }

            logger.debug('Invoice Extraction Result', {
                extractedData,
            });
        } catch (parseError: any) {
            logger.error('Failed to parse AI response', {
                error: parseError.message,
                aiResponse: responseText,
            });
            throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
        }

        onProgress?.({ type: 'validating', message: 'Validating extracted data...', progress: 90 });
        const validatedData = validateInvoiceData(extractedData);

        onProgress?.({ type: 'complete', message: 'Invoice processed successfully', progress: 100 });

        return validatedData;
    } catch (error: any) {
        const totalDuration = Date.now() - startTime;
        const errorMessage = error.message || String(error);

        logger.error('Invoice processing failed', {
            error: errorMessage,
            duration: `${totalDuration}ms`,
            errorType: error.name,
            stack: error.stack,
        });

        throw new Error(`Failed to process invoice: ${errorMessage}`);
    }
};

function validateInvoiceData(data: ExtractedInvoiceData): ExtractedInvoiceData {
    return {
        ...data,
        totalAmount: data.totalAmount ? parseFloat(String(data.totalAmount)) : null,
        taxAmount: data.taxAmount ? parseFloat(String(data.taxAmount)) : null,
        subtotal: data.subtotal ? parseFloat(String(data.subtotal)) : null,
        invoiceDate: data.invoiceDate || null,
        dueDate: data.dueDate || null,
        items: data.items || [],
    };
}
