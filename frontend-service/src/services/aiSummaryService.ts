import axios from '../axios';
import { environment } from '../globals';
import { AISummaryResponse } from '../interfaces/ai';

const { ai } = environment.api;

/**
 * Sends files to the Semantic-service for summarization.
 * @param files Array of File objects to summarize.
 * @param timeout Timeout for the request in milliseconds.
 * @returns The summary response from the AI service.
 */
export const summarizeFilesRequest = async (files: File[], timeout?: number): Promise<AISummaryResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });

    const { data } = await axios.post<AISummaryResponse>(`${ai}/summarize`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout,
    });

    return data;
};
