import { Stream } from 'node:stream';
import { chunk } from 'llm-chunk';
import config from '../config';
import { IElasticDoc } from '../express/semantics/interface';
import ModelEmbeddingApiService from '../externalServices/model/embedding';

const {
    model: { charsToRemove, sentenceSplitter, maxSentenceLength, llmChunkSplitterOptions },
    modelApi: {
        embedding: { concurrentSentenceEmbeddingLimit },
    },
} = config;

export const streamToBuffer = (stream: Stream) => {
    const buffer: Uint8Array[] = [];

    return new Promise<Buffer>((resolve, reject) => {
        stream.on('data', (dataChunk) => buffer.push(dataChunk));
        stream.on('end', () => resolve(Buffer.concat(buffer)));
        stream.on('error', reject);
    });
};
const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const cleanText = (text: string) =>
    text
        .replace(new RegExp(`[${escapeRegExp(charsToRemove)}]`, 'g'), ' ')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Example: chunks: ['Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing']
 * concurrentSentenceEmbeddingLimit = 2, maxSentenceLength = 3, sentenceSplitter = ' '
 * returns: [['Lorem ipsum dolor', 'sit amet consectetur'], [adipiscing]]
 * Each sentence is 3 words long. And each sub array has at most 2 elements

 * @param splittedText The text after it has been splitted.
 * @returns A 2 dimensional string array. Each sub-array size is detemined by concurrentSentenceEmbeddingLimit
 * (meaning how many sentences the model can embbed at once). Each element of the inner array is detemined by
 * maxSentenceLength (meaning how long of a sentence can the model embbed).
 */
const getTextForEmbedding = (splittedText: string[]): string[][] => {
    const arraysOfJoinedSentences: string[][] = [[]];

    for (let index = 0; index < splittedText.length; index += maxSentenceLength) {
        const sentence = splittedText.slice(index, index + maxSentenceLength).join(sentenceSplitter);

        if (arraysOfJoinedSentences.at(-1)?.length === concurrentSentenceEmbeddingLimit) {
            arraysOfJoinedSentences.push([]);
        }

        arraysOfJoinedSentences.at(-1)?.push(sentence);
    }

    return arraysOfJoinedSentences;
};

export const splitTextIntoChunks = async (
    text: string,
    title: string,
    templateId: string,
    entityId: string,
    minioFileId: string,
    workspaceId: string,
): Promise<IElasticDoc[]> => {
    const cleanedText = cleanText(text);

    if (!maxSentenceLength) {
        const embedding = await ModelEmbeddingApiService.embed([cleanedText])[0];

        return [
            {
                text: cleanedText,
                embedding,
                title,
                templateId,
                entityId,
                minioFileId,
                workspaceId,
                chunkIndex: 0,
            },
        ];
    }

    const splitText = chunk(cleanedText, llmChunkSplitterOptions);

    const chunksForEmbedding = getTextForEmbedding(splitText);

    const chunks: IElasticDoc[] = [];

    await Promise.all(
        chunksForEmbedding.map(async (splittedTextChunk) => {
            const filtered = splittedTextChunk.filter((textChunk) => textChunk.length > 0);
            const embeddings = await ModelEmbeddingApiService.embed(filtered);

            filtered.forEach((textChunk, index) => {
                chunks.push({
                    text: textChunk,
                    embedding: embeddings[index],
                    title,
                    templateId,
                    entityId,
                    minioFileId,
                    workspaceId,
                    chunkIndex: index,
                });
            });
        }),
    );

    return chunks;
};
