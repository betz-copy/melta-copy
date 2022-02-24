import * as fs from 'fs';
import { once } from 'events';

export const fsCreateReadStream = async (
    path: fs.PathLike,
    options?:
        | string
        | {
              flags?: string;
              encoding?: string;
              fd?: number;
              mode?: number;
              autoClose?: boolean;
              emitClose?: boolean;
              start?: number;
              end?: number;
              highWaterMark?: number;
          },
): Promise<fs.ReadStream> => {
    const fileReadStream = fs.createReadStream(path, options);
    await once(fileReadStream, 'ready');
    return fileReadStream;
};
