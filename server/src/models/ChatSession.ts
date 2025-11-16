import mongoose, { Schema } from 'mongoose';
import { IChatSession } from '../types';

const chatSessionSchema = new Schema<IChatSession>(
    {
        userId: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            default: 'New Chat',
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (_doc, ret: any) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

chatSessionSchema.index({ userId: 1, lastMessageAt: -1 });

const ChatSession = mongoose.model<IChatSession>('ChatSession', chatSessionSchema);

export default ChatSession;
