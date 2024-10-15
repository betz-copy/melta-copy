import { Stream } from 'stream';
import config from '../config';
import { Chunk } from '../express/semantics/interface';
import { ModelApiService } from '../externalServices/modelApi';

const {
    model: { charsToRemove, chunkSplitter, chunkSize },
    modelApi: { chunkBatchSize },
} = config;

export const streamToBuffer = (stream: Stream) => {
    return new Promise<Buffer>((resolve, reject) => {
        const buffer: Uint8Array[] = [];
        stream.on('data', (chunk) => buffer.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(buffer)));
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
        const embedding = await ModelApiService.embed([cleanedText])[0];

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
    const textChunks: string[] = [];
    const chunks: Chunk[] = [];

    for (let i = 0; i < splitText.length; i += chunkSize) {
        const joinedChunk = splitText.slice(i, i + chunkSize).join(chunkSplitter);
        textChunks.push(joinedChunk);
    }

    const splittedTextChunks = textChunks.reduce((acc: string[][], textChunk, index) => {
        if (index % chunkBatchSize === 0) acc.push([]);
        acc[acc.length - 1].push(textChunk);

        return acc;
    }, []);

    console.log('splittedTextChunks', splittedTextChunks);

    await Promise.all(
        splittedTextChunks.map(async (splittedTextChunk) => {
            const filtered = splittedTextChunk.filter((textChunk) => textChunk.length > 0);
            const embeddings = await ModelApiService.embed(filtered);
            // console.log('embeddings', embeddings);

            filtered.forEach((textChunk, index) => {
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
