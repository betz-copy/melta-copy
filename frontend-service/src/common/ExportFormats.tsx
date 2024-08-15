import { FileDownloadOutlined } from '@mui/icons-material';
import { Autocomplete, Button, CircularProgress, Grid, TextField, useTheme } from '@mui/material';
import i18next from 'i18next';
import fileDownload from 'js-file-download';
import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { exportEntityToDocumentRequest } from '../services/entitiesService';
import { getLongDate } from '../utils/date';
import { getFileName } from '../utils/getFileName';
import { EntityWizardValues } from './dialogs/entity';

export const ExportFormats: React.FC<{
    properties: EntityWizardValues['properties'];
    documentTemplateIds?: string[];
    disabled?: boolean;
    justifyContent?: React.CSSProperties['justifyContent'];
}> = ({ properties, documentTemplateIds = [], disabled = false, justifyContent }) => {
    const theme = useTheme();

    const [selectedFileToExport, setSelectedFileToExport] = useState('');

    const { isLoading: isExportToFileLoading, mutate: exportMutation } = useMutation(
        ({ documentTemplateId, entityProperties }: { documentTemplateId: string; entityProperties: EntityWizardValues['properties'] }) =>
            exportEntityToDocumentRequest(documentTemplateId, entityProperties),
        {
            onSuccess: (file) => {
                const [fileName, fileExtension] = getFileName(selectedFileToExport).split('.');
                fileDownload(file, `${fileName}_${getLongDate(new Date())}.${fileExtension}`);
            },
            onError: () => {
                toast.error(i18next.t('errorPage.fileDownloadError'));
            },
        },
    );

    return (
        <Grid container item justifyContent={justifyContent} flexDirection="row" flexWrap="nowrap" spacing={2} alignItems="center">
            <Grid item>
                <Autocomplete
                    options={documentTemplateIds.map((fileName) => ({
                        label: getFileName(fileName),
                        value: fileName,
                    }))}
                    onChange={(_e, selectedOption) => setSelectedFileToExport(selectedOption?.value!)}
                    disabled={disabled}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            size="small"
                            sx={{
                                '& .MuiInputBase-root': {
                                    borderRadius: '10px',
                                    width: 250,
                                },
                                '& fieldset': {
                                    borderColor: '#CCCFE5',
                                    color: '#CCCFE5',
                                },
                                '& label': {
                                    color: '#9398C2',
                                },
                            }}
                            name="selectedExportFormat"
                            variant="outlined"
                            label={i18next.t('wizard.entityTemplate.exportDocuments')}
                        />
                    )}
                />
            </Grid>

            <Grid item>
                <Button
                    sx={{
                        borderRadius: '0.5rem',
                        bgcolor: '#EBEFFA',
                        color: theme.palette.primary.main,
                        ':hover': { color: 'white' },
                        textWrap: 'nowrap',
                    }}
                    variant="contained"
                    startIcon={isExportToFileLoading ? <CircularProgress /> : <FileDownloadOutlined />}
                    onClick={() => {
                        exportMutation({ documentTemplateId: selectedFileToExport, entityProperties: properties });
                    }}
                    disabled={!selectedFileToExport?.length || isExportToFileLoading}
                >
                    {i18next.t('entityPage.download')}
                </Button>
            </Grid>
        </Grid>
    );
};
