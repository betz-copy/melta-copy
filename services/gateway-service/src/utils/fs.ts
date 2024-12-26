import fs from 'fs';
import { once } from 'events';
import { logger } from '@microservices/shared';
import { trycatch } from '.';

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

export const removeTmpFile = async (filePath: string) => {
    const { err: rmTmpFileErr } = await trycatch(() => fs.promises.unlink(filePath));
    if (rmTmpFileErr) logger.error(`failed to remove tmp file (storage leak)`, { error: rmTmpFileErr });
};

export default fsCreateReadStream;
