import mongoose, { Schema } from 'mongoose';
import { IChatMessage } from '../types';

const chatMessageSchema = new Schema<IChatMessage>(
    {
        sessionId: {
            type: Schema.Types.ObjectId as any,
            ref: 'ChatSession',
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (_doc, ret: any) {
                ret.id = ret._id.toString();
                ret.sessionId = ret.sessionId.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);

export default ChatMessage;
