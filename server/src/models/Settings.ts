import mongoose, { Schema } from 'mongoose';

export interface IGoogleDriveIntegration {
    accessToken: string;
    refreshToken: string;
    tokenExpiry?: Date;
    folderId?: string;
    folderName?: string;
    isConnected: boolean;
    connectedAt?: Date;
}

export interface ISettings extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    googleDrive?: IGoogleDriveIntegration;
    createdAt: Date;
    updatedAt: Date;
}

const googleDriveIntegrationSchema = new Schema<IGoogleDriveIntegration>({
    accessToken: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
        required: true,
    },
    tokenExpiry: Date,
    folderId: String,
    folderName: {
        type: String,
        default: 'expenses',
    },
    isConnected: {
        type: Boolean,
        default: false,
    },
    connectedAt: Date,
});

const settingsSchema = new Schema<ISettings>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        googleDrive: googleDriveIntegrationSchema,
    },
    {
        timestamps: true,
    }
);

const Settings = mongoose.model<ISettings>('Settings', settingsSchema);

export default Settings;
