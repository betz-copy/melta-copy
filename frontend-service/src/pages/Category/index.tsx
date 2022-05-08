import React, { useState, useRef } from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { Grid, ToggleButton, ToggleButtonGroup, IconButton, Typography, CircularProgress } from '@mui/material';
import { TableChartOutlined, AccountTreeOutlined, AddCircle as AddIcon, DownloadForOffline as DonwloadIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { exportMultipleSheetsAsExcel } from '@noam7700/ag-grid-enterprise';
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
    const [viewType, setViewType] = useState<'table' | 'graph'>('table');
    const [templateToHide, setTemplatesToHide] = useState<string[]>([]);

    const templateTablesRef = useRef<Array<React.ComponentRef<typeof TemplateTable> | null>>([]);

    const templates = queryClient
        .getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')
        ?.filter((template) => template.category._id === categoryId);

    const categoryDisplayName = queryClient
        .getQueryData<IMongoCategory[]>('getCategories')
        ?.find((oneCategory) => oneCategory._id === categoryId)?.displayName;

    const onExcelExport = () => {
        exportMultipleSheetsAsExcel({
            data: templateTablesRef.current.map((item) => item!.getExcelData()),
            fileName: `${categoryDisplayName}.xlsx`,
        });
    };

    if (templates) {
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
                    <Grid item>
                        <ToggleButtonGroup
                            style={{ backgroundColor: 'white' }}
                            size="small"
                            color="primary"
                            exclusive
                            value={viewType}
                            onChange={(_ev, newValue) => {
                                if (newValue !== null) setViewType(newValue);
                            }}
                        >
                            <ToggleButton size="small" value="table">
                                <TableChartOutlined fontSize="small" />
                            </ToggleButton>
                            <ToggleButton size="small" value="graph">
                                <AccountTreeOutlined />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                </Grid>
                <Grid container>
                    {viewType === 'table' ? (
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
                    ) : (
                        <>graph</>
                    )}
                </Grid>
            </Grid>
        );
    }

    return <CircularProgress size={20} />;
};

export default Category;
