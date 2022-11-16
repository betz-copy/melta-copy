import React, { useRef, useState } from 'react';
import { Grid, Box, CircularProgress } from '@mui/material';
import { AddCircle, VerticalAlignBottomOutlined as DownloadIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { AxiosError } from 'axios';
import { useMutation, useQuery } from 'react-query';
import { toast } from 'react-toastify';
import fileDownload from 'js-file-download';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { AddEntityButton } from './AddEntityButton';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';
import { BlueTitle } from '../BlueTitle';
import { ResetFilterButton } from './ResetFilterButton';
import IconButtonWithPopoverText from '../IconButtonWithPopover';
import { CustomIcon } from '../CustomIcon';
import { exportTemplatesToExcelRequest, deleteEntityRequest } from '../../services/entitiesService';
import { ErrorToast } from '../ErrorToast';
import { AreYouSureDialog } from '../dialogs/AreYouSureDialog';

const TemplateTable = ({ template, quickFilterText, page }: { template: IMongoEntityTemplatePopulated; quickFilterText: string; page: string }) => {
    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef>(null);
    const { isFetching: isExportingTableToExcelFile, refetch: exportTemplateToExcel } = useQuery(
        ['exportTemplateToExcel', [template._id], `${template.displayName}.xlsx`],
        () => exportTemplatesToExcelRequest([template._id], `${template.displayName}.xlsx`),
        {
            enabled: false,
            onError(error) {
                console.log('Failed to export table', error);
                toast.error(i18next.t('failedToExportTable'));
            },
            onSuccess(data) {
                fileDownload(data, `${template.displayName}.xlsx`);
            },
        },
    );
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const closeDeleteDialog = () => {
        setOpenDeleteDialog(false);
    };
    const { isLoading: isDeleteLoading, mutateAsync: deleteMutation } = useMutation(() => deleteEntityRequest(template._id), {
        onError: (error: AxiosError) => {
            closeDeleteDialog();
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entity.failedToDelete')} />);
        },
        onSuccess: () => {
            toast.success(i18next.t('wizard.entity.deletedSuccessfully'));
            closeDeleteDialog();
        },
    });
    return (
        <Grid container>
            <Grid container paddingLeft={3} justifyContent="space-between" width="100%">
                <Grid item container xs={5}>
                    <Grid item>{template.iconFileId && <CustomIcon iconUrl={template.iconFileId} height="30px" width="30px" color="#225AA7" />}</Grid>
                    <Grid item paddingLeft="10px">
                        <BlueTitle title={template.displayName} component="h6" variant="h6" />
                    </Grid>
                </Grid>
                <Grid>
                    <Grid item>
                        <ResetFilterButton entitiesTableRef={entitiesTableRef} />
                        <IconButtonWithPopoverText
                            popoverText={i18next.t('entitiesTableOfTemplate.downloadOneTable')}
                            iconButtonProps={{ onClick: () => exportTemplateToExcel(), size: 'medium' }}
                        >
                            {isExportingTableToExcelFile ? <CircularProgress size="24px" /> : <DownloadIcon color="primary" fontSize="medium" />}
                        </IconButtonWithPopoverText>
                        <AddEntityButton
                            initialStep={1}
                            disabled={template.disabled}
                            initialValues={{ template, properties: { disabled: false }, attachmentsProperties: {} }}
                        >
                            <AddCircle color={!template.disabled ? 'primary' : 'disabled'} fontSize="large" data-tour="create-entity" />
                        </AddEntityButton>
                    </Grid>
                </Grid>
            </Grid>
            <Box sx={{ marginBottom: '30px', width: '100%' }}>
                <EntitiesTableOfTemplate
                    deleteRowButtonProps={{
                        popoverText: template.disabled
                            ? i18next.t('entitiesTableOfTemplate.deleteEntity')
                            : i18next.t('permissions.dontHavePermissionsToCategory'),
                        onClick: () => {
                            setOpenDeleteDialog(true);
                        },
                        disabled: !template.disabled,
                    }}
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
            <AreYouSureDialog open={openDeleteDialog} handleClose={closeDeleteDialog} onYes={() => deleteMutation()} isLoading={isDeleteLoading} />
        </Grid>
    );
};

export { TemplateTable };
