import pdf from 'pdf-parse';

/**
 * Extracts text content from a PDF buffer.
 * @param buffer - The PDF file as a Buffer
 * @returns The extracted text content
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
        const data = await pdf(buffer);

        // Basic cleaning: normalize whitespace
        const cleanedText = data.text.replace(/\s+/g, ' ').trim();

        return cleanedText;
    } catch (error) {
        throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
