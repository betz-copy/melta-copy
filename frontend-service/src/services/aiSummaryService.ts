import axios from '../axios';

export interface IAISummaryResponse {
    success: boolean;
    fileCount: number;
    processedFiles: string[];
    totalPages: number;
    extractedChars: number;
    summary: string;
    model: string;
}

/**
 * Sends files to the AISummary-service for summarization.
 * @param files Array of File objects to summarize.
 * @returns The summary response from the AI service.
 */
export const summarizeFilesRequest = async (files: File[]): Promise<IAISummaryResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });

    const { data } = await axios.post<IAISummaryResponse>('/ai-summary/summarize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data;
};
