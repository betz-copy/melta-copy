import React, { useState, useRef } from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { Grid, IconButton, Typography } from '@mui/material';
import { AddCircle as AddIcon, DownloadForOffline as DonwloadIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { exportMultipleSheetsAsExcel } from '@noam7700/ag-grid-enterprise-excel-export';
import { TemplateTable } from './components/TemplateTable';
import { Header } from '../../common/Header';
import { IMongoCategory } from '../../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { SelectCheckbox } from '../../common/SelectCheckbox';
import { AddEntityButton } from './components/AddEntityButton';

const Category: React.FC = () => {
    const queryClient = useQueryClient();
    const params = useParams();
    const { categoryId } = params;
    const [templateToHide, setTemplatesToHide] = useState<string[]>([]);

    const templateTablesRef = useRef<Array<React.ComponentRef<typeof TemplateTable> | null>>([]);

    const templates = queryClient
        .getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!
        .filter((template) => template.category._id === categoryId);

    const categoryDisplayName = queryClient
        .getQueryData<IMongoCategory[]>('getCategories')!
        .find((oneCategory) => oneCategory._id === categoryId)?.displayName;

    const onExcelExport = () => {
        exportMultipleSheetsAsExcel({
            data: templateTablesRef.current.map((item) => item!.getExcelData()),
            fileName: `${categoryDisplayName}.xlsx`,
        });
    };

    return (
        <Grid container>
            <Grid container justifyContent="center" marginBottom="1vh">
                <Header title={categoryDisplayName || ''}>
                    <SelectCheckbox
                        title={i18next.t('entityTemplates')}
                        handleChange={(event) => setTemplatesToHide(event.target.value as string[])}
                        options={templates.map((template) => template.displayName)}
                        optionsToHide={templateToHide}
                    />
                </Header>
            </Grid>
            <Grid container justifyContent="end" marginBottom="3vh">
                <Grid item paddingRight="1%">
                    <IconButton style={{ background: 'white', borderRadius: '7px' }} onClick={onExcelExport}>
                        <DonwloadIcon color="primary" />
                        <Typography fontSize={14} style={{ fontWeight: '500', paddingRight: '5px' }}>
                            {i18next.t('downloadMultipleTables')}
                        </Typography>
                    </IconButton>
                </Grid>
                <Grid item paddingRight="1%">
                    <AddEntityButton style={{ background: 'white', borderRadius: '7px' }}>
                        <AddIcon color="primary" />
                        <Typography fontSize={14} style={{ fontWeight: '500', paddingRight: '5px' }}>
                            {i18next.t('addEntity')}
                        </Typography>
                    </AddEntityButton>
                </Grid>
            </Grid>
            <Grid container>
                {templates
                    .filter((template) => !templateToHide.includes(template.displayName))
                    .map((template, index) => (
                        <TemplateTable
                            // eslint-disable-next-line no-return-assign
                            ref={(el) => (templateTablesRef.current[index] = el)}
                            key={template._id}
                            template={template}
                        />
                    ))}
            </Grid>
        </Grid>
    );
};

export default Category;
