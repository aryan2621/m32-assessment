import { supabase } from '../config/supabase';
import { config } from '../config/constants';

export interface UploadResult {
    path: string;
    url: string;
}

export const uploadFile = async (
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
): Promise<UploadResult> => {
    const uniqueName = `${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
        .from(config.supabaseBucketName!)
        .upload(uniqueName, fileBuffer, {
            contentType,
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        throw new Error(`Failed to upload file to Supabase: ${error.message}`);
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from(config.supabaseBucketName!).getPublicUrl(uniqueName);

    return {
        path: data.path,
        url: publicUrl,
    };
};

export const deleteFile = async (filePath: string): Promise<void> => {
    const { error } = await supabase.storage.from(config.supabaseBucketName!).remove([filePath]);

    if (error) {
        throw new Error(`Failed to delete file from Supabase: ${error.message}`);
    }
};

export const downloadFile = async (fileUrl: string): Promise<Buffer> => {
    try {
        const url = new URL(fileUrl);
        const pathParts = url.pathname.split('/').filter((part) => part);
        const bucketIndex = pathParts.indexOf(config.supabaseBucketName!);

        if (bucketIndex === -1 || pathParts.length <= bucketIndex + 1) {
            throw new Error('Invalid file URL format');
        }

        const filePath = pathParts.slice(bucketIndex + 1).join('/');

        const { data, error } = await supabase.storage
            .from(config.supabaseBucketName!)
            .download(filePath);

        if (error) {
            throw new Error(`Failed to download file from Supabase: ${error.message}`);
        }

        const arrayBuffer = await data.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error: any) {
        if (error instanceof TypeError) {
            const urlParts = fileUrl.split('/');
            const fileName = urlParts[urlParts.length - 1].split('?')[0];

            const { data, error: downloadError } = await supabase.storage
                .from(config.supabaseBucketName!)
                .download(fileName);

            if (downloadError) {
                throw new Error(`Failed to download file from Supabase: ${downloadError.message}`);
            }

            const arrayBuffer = await data.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }
        throw error;
    }
};
