import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { Grid, Box } from '@mui/material';
import { AddCircle, FileDownloadOutlined } from '@mui/icons-material';
import { exportMultipleSheetsAsExcel } from '@noam7700/ag-grid-enterprise-excel-export';
import i18next from 'i18next';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { AddEntityButton } from './AddEntityButton';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';
import { BlueTitle } from '../BlueTitle';
import { ResetFilterButton } from './ResetFilterButton';
import IconButtonWithPopoverText from '../IconButtonWithPopover';
import { CustomIcon } from '../CustomIcon';

const TemplateTable = forwardRef<
    EntitiesTableOfTemplateRef,
    {
        template: IMongoEntityTemplatePopulated;
        quickFilterText: string;
        page: string;
    }
>(({ template, quickFilterText, page }, ref) => {
    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef>(null);

    const onExcelExport = () => {
        exportMultipleSheetsAsExcel({
            data: [entitiesTableRef.current!.getExcelData()!],
            fileName: `${template.displayName}.xlsx`,
        });
    };

    useImperativeHandle(ref, () => entitiesTableRef.current!);

    return (
        <Grid container>
            <Grid container paddingLeft={3} justifyContent="space-between" width="100%">
                <Grid item container xs={5}>
                    <Grid item>{template.iconFileId && <CustomIcon iconUrl={template.iconFileId} height="30px" width="30px" color="#1976d2" />}</Grid>
                    <Grid item paddingLeft="10px">
                        <BlueTitle title={template.displayName} component="h6" variant="h6" />
                    </Grid>
                </Grid>
                <Grid>
                    <Grid item>
                        <ResetFilterButton entitiesTableRef={entitiesTableRef} />
                        <IconButtonWithPopoverText
                            popoverText={i18next.t('entitiesTableOfTemplate.downloadOneTable')}
                            iconButtonProps={{ onClick: onExcelExport, size: 'medium' }}
                        >
                            <FileDownloadOutlined color="primary" fontSize="medium" />
                        </IconButtonWithPopoverText>
                        <AddEntityButton
                            initialStep={1}
                            disabled={template.disabled}
                            initialValues={{ template, properties: { disabled: false }, attachmentsProperties: {} }}
                        >
                            <AddCircle color={!template.disabled ? 'primary' : 'disabled'} fontSize="large" />
                        </AddEntityButton>
                    </Grid>
                </Grid>
            </Grid>
            <Box sx={{ marginBottom: '30px', width: '100%' }}>
                <EntitiesTableOfTemplate
                    ref={entitiesTableRef}
                    template={template}
                    showNavigateToRowButton
                    getRowId={(entity) => entity.properties._id}
                    getEntityPropertiesData={(entity) => entity.properties}
                    rowModelType="serverSide"
                    quickFilterText={quickFilterText}
                    rowHeight={50}
                    fontSize="16px"
                    minColumnWidth={200}
                    filterStorageProps={{ shouldSaveFilter: true, pageType: page }}
                />
            </Box>
        </Grid>
    );
});

export { TemplateTable };
