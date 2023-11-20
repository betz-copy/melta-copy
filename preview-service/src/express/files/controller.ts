import * as express from "express";
import { getFileName } from "../../utils/generatePath";
import { FilesManager } from "./manager";
import { finished } from "stream-promise";

export class FilesController {
  static async filePreview(req: express.Request, res: express.Response) {
    const { path, needsConversion } = req.params;
    const fileStats = await FilesManager.fileStat(path);
    res.setHeader("Content-Type", fileStats.metaData["content-type"]);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${getFileName(path)}`
    );
    if (needsConversion) {
      const resultStream = await FilesManager.previewFiles(path);
      res.attachment();
      resultStream.pipe(res);
      await finished(resultStream);
    } else {
      const stream = await FilesManager.minioDownloadFile(path);

      stream.pipe(res);
    }
  }
}
