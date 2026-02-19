import { Readable } from 'node:stream';
import { FileTypes } from '@packages/semantic-search';
import { ServiceError } from '@packages/utils';
import Excel from 'exceljs';
import { StatusCodes } from 'http-status-codes';

const readExcelData = async (buffer: Buffer, type: FileTypes.CSV | FileTypes.XLSX) => {
    const workbook = new Excel.Workbook();
    const fileStream = Readable.from(buffer);

    switch (type) {
        case FileTypes.XLSX:
            await workbook.xlsx.read(fileStream);
            break;
        case FileTypes.CSV:
            await workbook.csv.read(fileStream);
            break;
        default:
            throw new ServiceError(StatusCodes.BAD_REQUEST, 'Unsupported file type');
    }

    const worksheet = workbook.worksheets[0];
    const excelData: string[] = [];
    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            excelData.push(cell.text ?? cell.value?.toString());
        });
    });

    return excelData.toString();
};

export default readExcelData;
