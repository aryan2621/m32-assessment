import { Request } from 'express';
import { Document } from 'mongoose';

export interface IUser extends Document {
    _id: string;
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    role: 'user' | 'admin';
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IInvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface IInvoice extends Document {
    _id: string;
    userId: any;
    fileUrl: string;
    fileName: string;
    fileType: 'pdf' | 'image';
    vendorName?: string;
    vendorEmail?: string;
    vendorPhone?: string;
    invoiceNumber?: string;
    invoiceDate?: Date;
    dueDate?: Date;
    totalAmount?: number;
    currency: string;
    taxAmount?: number;
    subtotal?: number;
    items: IInvoiceItem[];
    category: 'utilities' | 'software' | 'office' | 'marketing' | 'other';
    status: 'pending' | 'paid' | 'overdue';
    paymentMethod?: string;
    notes?: string;
    isProcessed: boolean;
    processingError?: string;
    confidence?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IChatSession extends Document {
    _id: string;
    userId: string;
    title: string;
    lastMessageAt: Date;
    isActive: boolean;
    createdAt: Date;
}

export interface IChatMessage extends Document {
    _id: string;
    sessionId: string;
    userId: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
}

export interface IExpense extends Document {
    _id: string;
    userId: string;
    invoiceId?: string;
    amount: number;
    currency: string;
    category: string;
    vendor?: string;
    description?: string;
    date: Date;
    createdAt: Date;
}

export type AuthRequest = Request;

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}
