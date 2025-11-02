import { once } from 'events';
import fs from 'fs';

type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex';

interface CreateReadStreamOptions {
    flags?: string;
    encoding?: BufferEncoding;
    fd?: number;
    mode?: number;
    autoClose?: boolean;
    emitClose?: boolean;
    start?: number;
    end?: number;
    highWaterMark?: number;
}

const fsCreateReadStream = async (path: fs.PathLike, options?: BufferEncoding | CreateReadStreamOptions) => {
    const fileReadStream = fs.createReadStream(path, options);
    await once(fileReadStream, 'ready');

    return fileReadStream;
};

export default fsCreateReadStream;
