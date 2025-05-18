import { Stream } from 'stream';

// eslint-disable-next-line import/prefer-default-export
export const streamToBuffer = (stream: Stream) => {
    return new Promise<Buffer>((resolve, reject) => {
        const buffer: Uint8Array[] = [];
        stream.on('data', (chunk) => buffer.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(buffer)));
        stream.on('error', reject);
    });
};
