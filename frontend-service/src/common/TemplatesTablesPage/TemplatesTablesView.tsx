import React, { forwardRef, useRef, useState } from 'react';
import _isEqual from 'lodash.isequal';
import { Divider, Grid, Pagination } from '@mui/material';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';
import { TemplateTable } from './TemplateTable';

const TemplateTablesView = forwardRef<
    { onExcelExportTables: (excelFileName: string) => void },
    {
        templates: IMongoEntityTemplatePopulated[];
        searchInput: string;
        pageSize?: number;
        pageType: string;
    }
>(({ templates, searchInput, pageSize = 10, pageType }) => {
    const [currPage, setCurrPage] = useState(1);
    const countOfPages = Math.ceil(templates.length / pageSize);

    const startOfPageIndex = (currPage - 1) * pageSize;
    const templatesOfPage = templates.slice(startOfPageIndex, startOfPageIndex + pageSize);

    const templateTableRefs = useRef<Record<string, EntitiesTableOfTemplateRef | null>>({});

    return (
        <Grid container direction="column" spacing={1}>
            {templatesOfPage.map((template) => (
                <Grid item key={template._id}>
                    <TemplateTable
                        // eslint-disable-next-line no-return-assign
                        ref={(el) => (templateTableRefs.current[template._id] = el)}
                        template={template}
                        quickFilterText={searchInput}
                        page={pageType}
                    />
                </Grid>
            ))}
            <Grid item>
                <Divider />
            </Grid>
            <Grid item alignSelf="center" margin={2}>
                <Pagination
                    page={currPage}
                    onChange={(_e, page) => setCurrPage(page)}
                    count={countOfPages}
                    size="large"
                    showFirstButton
                    showLastButton
                />
            </Grid>
        </Grid>
    );
});

export default TemplateTablesView;
