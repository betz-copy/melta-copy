import { Stream } from 'stream';
import config from '../config';
import { Chunk } from '../express/semantics/interface';
import { ModelApiService } from '../externalServices/modelApi';

const {
    model: { charsToRemove, chunkSplitter, chunkSize },
    modelApi: { chunkBatchSize },
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

export const splitTextIntoChunks = async (
    text: string,
    title: string,
    templateId: string,
    entityId: string,
    minioFileId: string,
    workspaceId: string,
): Promise<Chunk[]> => {
    const cleanedText = cleanText(text);

    if (!chunkSize) {
        const embedding = ModelApiService.embed([cleanedText])[0];

        return [
            {
                text: cleanedText,
                embedding,
                title,
                template_id: templateId,
                entity_id: entityId,
                minio_file_id: minioFileId,
                workspace_id: workspaceId,
            },
        ];
    }

    const splitText = cleanedText.split(chunkSplitter);
    let joinedChunk = '';
    const textChunks: string[] = [];
    const chunks: Chunk[] = [];

    for (let i = 0; i < splitText.length; i += chunkSize) {
        joinedChunk += splitText.slice(i, i + chunkSize).join(chunkSplitter);
        textChunks.push(joinedChunk);
    }

    const splittedTextChunks = textChunks.reduce((acc: string[][], textChunk, index) => {
        if (index % chunkBatchSize === 0) acc.push([]);
        acc[acc.length - 1].push(textChunk);

        return acc;
    }, []);

    await Promise.all(
        splittedTextChunks.map(async (splittedTextChunk) => {
            const embeddings = await ModelApiService.embed(splittedTextChunk);

            textChunks.forEach((textChunk, index) => {
                chunks.push({
                    text: textChunk,
                    embedding: embeddings[index],
                    title,
                    template_id: templateId,
                    entity_id: entityId,
                    minio_file_id: minioFileId,
                    workspace_id: workspaceId,
                });
            });
        }),
    );

    return chunks;
};
