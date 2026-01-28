import mammoth from 'mammoth';

/**
 * Extracts text content from a DOC/DOCX buffer.
 * @param buffer - The Word document file as a Buffer
 * @returns The extracted text content
 */
export async function extractTextFromDoc(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer });

        // Basic cleaning: normalize whitespace
        const cleanedText = result.value.replace(/\s+/g, ' ').trim();

        return cleanedText;
    } catch (error) {
        throw new Error(`Failed to extract text from DOC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
