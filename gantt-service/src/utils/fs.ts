import { once } from 'node:events';
import * as fs from 'node:fs';

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

const fsCreateReadStream = async (path: fs.PathLike, options?: CreateReadStreamOptions) => {
    const fileReadStream = fs.createReadStream(path, options);
    await once(fileReadStream, 'ready');

    return fileReadStream;
};

export default fsCreateReadStream;
