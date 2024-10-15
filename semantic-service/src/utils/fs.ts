import { Stream } from 'stream';
import config from '../config';
import { Chunk } from '../express/semantics/interface';

const {
    model: { charsToRemove, chunkSplitter, chunkSize },
} = config;

export const streamToString = (stream: Stream) => {
    return new Promise<string>((resolve, reject) => {
        let data: string = '';

        stream.on('data', (chunk) => {
            data += chunk.toString();
        });
        stream.on('end', () => resolve(data));
        stream.on('error', reject);
    });
};

const cleanText = (text: string) => text.replaceAll(new RegExp(`[${charsToRemove.join()}]`, 'g'), '');

export const splitTextIntoChunks = (
    text: string,
    title: string,
    templateId: string,
    entityId: string,
    minioFileId: string,
    workspaceId: string,
): Chunk[] => {
    const cleanedText = cleanText(text);

    if (!chunkSize) {
        return [
            {
                text: cleanedText,
                // embedding,
                title,
                template_id: templateId,
                entity_id: entityId,
                minioFileId,
                workspace_id: workspaceId,
            },
        ];
    }

    const splitText = cleanedText.split(chunkSplitter);
    let joinedChunk = '';
    const chunks: Chunk[] = [];

    for (let i = 0; i < splitText.length; i += chunkSize) {
        joinedChunk += splitText.slice(i, i + chunkSize).join(chunkSplitter);

        chunks.push({
            text: joinedChunk,
            // embedding,
            title,
            template_id: templateId,
            entity_id: entityId,
            minioFileId,
            workspace_id: workspaceId,
        });

        joinedChunk = '';
    }

    return chunks;
};
