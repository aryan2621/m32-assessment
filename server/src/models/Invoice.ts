import mongoose, { Schema } from 'mongoose';
import { IInvoice, IInvoiceItem } from '../types';

const invoiceItemSchema = new Schema<IInvoiceItem>({
    description: String,
    quantity: Number,
    unitPrice: Number,
    amount: Number,
});

const invoiceSchema = new Schema<IInvoice>(
    {
        userId: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            enum: ['pdf', 'image'],
            required: true,
        },
        vendorName: String,
        vendorEmail: String,
        vendorPhone: String,
        invoiceNumber: String,
        invoiceDate: Date,
        dueDate: Date,
        totalAmount: Number,
        currency: {
            type: String,
            default: 'INR',
        },
        taxAmount: Number,
        subtotal: Number,
        items: [invoiceItemSchema],
        category: {
            type: String,
            enum: ['utilities', 'software', 'office', 'marketing', 'other'],
            default: 'other',
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'overdue'],
            default: 'pending',
        },
        paymentMethod: String,
        notes: String,
        isProcessed: {
            type: Boolean,
            default: false,
        },
        processingError: String,
        confidence: Number,
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (_doc: IInvoice, ret: any) {
                ret.id = ret._id.toString();
                ret.vendor = ret.vendorName || '';
                ret.amount = ret.totalAmount || 0;
                ret.date = _doc.invoiceDate ? _doc.invoiceDate.toISOString() : null;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

invoiceSchema.index({ userId: 1, invoiceDate: -1 });
invoiceSchema.index({ vendorName: 1 });
invoiceSchema.index({ status: 1 });

const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);

export default Invoice;
