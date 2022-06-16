import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import _isEqual from 'lodash.isequal';
import { exportMultipleSheetsAsExcel } from '@noam7700/ag-grid-enterprise-excel-export';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';
import { TemplateTable } from './TemplateTable';
import { objectFilter } from '../../utils/object';

const TemplateTablesView = forwardRef<
    { onExcelExportTables: (excelFileName: string) => void },
    {
        templates: IMongoEntityTemplatePopulated[];
        searchInput: string;
    }
>(({ templates, searchInput }, ref) => {
    const templateTableRefs = useRef<Record<string, EntitiesTableOfTemplateRef | null>>({});

    useImperativeHandle(ref, () => ({
        onExcelExportTables: (excelFileName: string) => {
            const existingTemplateTableRefs = objectFilter(templateTableRefs.current, (_templateId, templateTableRef) => Boolean(templateTableRef));
            exportMultipleSheetsAsExcel({
                data: Object.values(existingTemplateTableRefs).map((item) => item!.getExcelData()!),
                fileName: excelFileName,
            });
        },
    }));

    return (
        <>
            {templates.map((template) => (
                <TemplateTable
                    // eslint-disable-next-line no-return-assign
                    ref={(el) => (templateTableRefs.current[template._id] = el)}
                    key={template._id}
                    template={template}
                    quickFilterText={searchInput}
                />
            ))}
        </>
    );
});

export default TemplateTablesView;
