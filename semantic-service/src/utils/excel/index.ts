import Excel from 'exceljs';
import { Stream } from 'stream';

const readExcelData = async (fileStream: Stream, type: 'csv' | 'xlsx') => {
    const workbook = new Excel.Workbook();

    if (type === 'xlsx') await workbook.xlsx.read(fileStream);
    else await workbook.csv.read(fileStream);

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
