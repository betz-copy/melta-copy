import { Stream } from 'node:stream';

export const streamToBuffer = (stream: Stream) => {
    return new Promise<Buffer>((resolve, reject) => {
        const buffer: Uint8Array[] = [];
        stream.on('data', (chunk) => buffer.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(buffer)));
        stream.on('error', reject);
    });
};
