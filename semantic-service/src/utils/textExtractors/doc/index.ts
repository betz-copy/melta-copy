import textract from 'textract';

const extractTextFromDoc = async (buffer: Buffer, mimeType: string = 'application/msword'): Promise<string> => {
    return new Promise((resolve, reject) => {
        textract.fromBufferWithMime(mimeType, buffer, (error, text) => {
            if (error) {
                console.log('Error extracting text from doc', error);

                return reject(error);
            }

            console.log('Extracted text from doc', text);

            return resolve(text);
        });
    });
};

export default extractTextFromDoc;
