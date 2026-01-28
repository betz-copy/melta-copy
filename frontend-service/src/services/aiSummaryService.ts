import axios from '../axios';

export interface IAISummaryResponse {
    summary: string;
}

/**
 * Sends files to the AISummary-service for summarization.
 * @param files Array of File objects to summarize.
 * @param timeout (Optional) Timeout for the request in milliseconds.
 * @returns The summary response from the AI service.
 */
export const summarizeFilesRequest = async (files: File[], timeout: number = 180000): Promise<IAISummaryResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });

    const { data } = await axios.post<IAISummaryResponse>('/ai-summary/summarize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout,
    });

    return data;
};
