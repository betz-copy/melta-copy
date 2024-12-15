// /* eslint-disable consistent-return */
// import { NextFunction, Request, Response } from 'express';
// import * as Busboy from 'busboy';
// import { Readable } from 'stream';
// import { config } from '../../config';
// import { BadRequestError } from '../../express/error';
// import { generatePath } from '../generatePath';
// import DefaultManagerMinio from './manager';
// import { UploadedFile } from '../../express/files/interface';

// export class MinioStorage extends DefaultManagerMinio {
//     async uploadStreamToMinio(file: UploadedFile) {
//         const path = generatePath(file.originalname);

//         console.log('Uploading to MinIO:', { file });

//         await this.minioClient.uploadFileStream(file.stream, path, file.size, {
//             'content-type': file.mimetype,
//         });

//         return { ...(await this.minioClient.statFile(path)), path };
//     }
// }

// export class MinioBusboy {
//     private static async wrapStorage(req: Request): Promise<MinioStorage | null> {
//         const workspaceId = req.headers[config.service.workspaceIdHeaderName];
//         if (typeof workspaceId !== 'string') return null;

//         const storage = new MinioStorage(workspaceId);

//         if (!(await storage.minioClient.bucketExists())) {
//             await storage.minioClient.makeBucket();
//         }

//         return storage;
//     }

//     static async uploadToMinio(req: Request, _res: Response, next: NextFunction) {
//         try {
//             const storage = await MinioBusboy.wrapStorage(req);
//             if (!storage) {
//                 return next(new BadRequestError('Invalid workspace ID in headers'));
//             }

//             const busboy = Busboy({ headers: req.headers });
//             let fileStat: any;

//             busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
//                 let size = 0;
//                 const chunks: Buffer[] = [];

//                 file.on('data', (data) => {
//                     size += data.length;
//                     chunks.push(data);
//                 });

//                 file.on('end', async () => {
//                     try {
//                         const fileBuffer = Buffer.concat(chunks);

//                         const uploadedFile: UploadedFile = {
//                             fieldname,
//                             originalname: filename,
//                             encoding,
//                             mimetype,
//                             path: generatePath(filename),
//                             size,
//                             stream: Readable.from(fileBuffer),
//                         };

//                         fileStat = await storage.uploadStreamToMinio(uploadedFile);
//                     } catch (error) {
//                         next(error);
//                     }
//                 });
//             });

//             busboy.on('finish', () => {
//                 req.body[config.busboy.fileKeyName] = fileStat;
//                 next();
//             });

//             busboy.on('error', (error) => {
//                 next(error);
//             });

//             req.pipe(busboy);
//         } catch (error) {
//             next(error);
//         }
//     }

//     static async uploadBulkToMinio(req: Request, _res: Response, next: NextFunction) {
//         try {
//             const storage = await MinioBusboy.wrapStorage(req);
//             if (!storage) {
//                 return next(new BadRequestError('Invalid workspace ID in headers'));
//             }

//             const busboy = Busboy({ headers: req.headers });
//             const uploadedFiles: UploadedFile[] = [];
//             const uploadPromises: Promise<void>[] = [];

//             busboy.on('file', (fieldname, file, { encoding, filename, mimeType: mimetype }) => {
//                 let size = 0;
//                 const chunks: Buffer[] = [];

//                 file.on('data', (data) => {
//                     size += data.length;
//                     chunks.push(data);
//                 });

//                 file.on('end', () => {
//                     const fileBuffer = Buffer.concat(chunks);

//                     const uploadedFile: UploadedFile = {
//                         fieldname,
//                         originalname: filename,
//                         encoding,
//                         mimetype,
//                         path: generatePath(filename),
//                         size,
//                         stream: Readable.from(fileBuffer),
//                     };

//                     const uploadPromise = storage
//                         .uploadStreamToMinio(uploadedFile)
//                         .then((stat) => {
//                             uploadedFiles.push({ ...uploadedFile, path: stat.path });
//                         })
//                         .catch(next);
//                     console.log('uploadedFilesss', uploadedFiles);

//                     uploadPromises.push(uploadPromise);
//                 });
//             });

//             busboy.on('finish', async () => {
//                 console.log({ uploadedFiles });

//                 try {
//                     await Promise.all(uploadPromises);
//                     req.body[config.busboy.filesKeyName] = uploadedFiles;
//                     next();
//                 } catch (error) {
//                     next(error);
//                 }
//             });

//             busboy.on('error', (error) => {
//                 next(error);
//             });

//             req.pipe(busboy);
//         } catch (error) {
//             next(error);
//         }
//     }
// }
