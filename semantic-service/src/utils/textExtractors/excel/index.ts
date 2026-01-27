import { Stream } from 'node:stream';
import { FileTypes } from '@microservices/shared';
import Excel from 'exceljs';

const readExcelData = async (fileStream: Stream, type: FileTypes.CSV | FileTypes.XLSX) => {
    const workbook = new Excel.Workbook();

    if (type === FileTypes.XLSX) {
        await workbook.xlsx.read(fileStream);
    } else if (type === FileTypes.CSV) {
        await workbook.csv.read(fileStream);
    } else {
        throw new Error('Unsupported file type');
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
