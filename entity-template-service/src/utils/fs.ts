import * as fs from 'fs';
import { once } from 'events';

export const fsCreateReadStream = async (
    path: fs.PathLike,
    options?:
        | BufferEncoding
        | {
              flags?: string;
              encoding?: BufferEncoding;
              fd?: number;
              mode?: number;
              autoClose?: boolean;
              emitClose?: boolean;
              start?: number;
              highWaterMark?: number;
              end?: number;
          },
): Promise<fs.ReadStream> => {
    const fileReadStream = fs.createReadStream(path, options);
    await once(fileReadStream, 'ready');
    return fileReadStream;
};
