import { promisify } from "util";
import { streamToBuffer } from "../../utils/fs";
import { minioClient } from "../../utils/minio/minioClient";
import * as libreoffice from "libreoffice-convert";
import { Readable } from "stream";

const libreConvert = promisify(libreoffice.convert);
export class FilesManager {
  static minioDownloadFile(path: string) {
    return minioClient.downloadFileStream(path);
  }

  static fileStat(filePath: string) {
    return minioClient.statFile(filePath);
  }

  static async previewFiles(filePath: string) {
    const fileStream = await FilesManager.minioDownloadFile(filePath);
    const fileBuffer = await streamToBuffer(fileStream);
    return Readable.from(await libreConvert(fileBuffer, ".pdf", undefined));
  }
}
