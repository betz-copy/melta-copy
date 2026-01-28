import { ArrowBack, ContentCopy } from '@mui/icons-material';
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    FormGroup,
    IconButton,
    TextField,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import axios from '../../axios';
import { environment } from '../../globals';
import { IChildTemplatePopulated } from '../../interfaces/childTemplates';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IAISummaryResponse, summarizeFilesRequest } from '../../services/aiSummaryService';
import { BackendConfigState } from '../../services/backendConfigService';
import { getFileName } from '../../utils/getFileName';

interface AISummaryDialogProps {
    open: boolean;
    handleClose: () => void;
    template: IMongoEntityTemplatePopulated | IChildTemplatePopulated;
    selectedRows: any[];
}

type Step = 'columns' | 'files' | 'result';

interface IFileOption {
    id: string;
    name: string;
}

export const AISummaryDialog: React.FC<AISummaryDialogProps> = ({ open, handleClose, template, selectedRows }) => {
    const theme = useTheme();
    const [step, setStep] = useState<Step>('columns');
    const [summary, setSummary] = useState<string>('');
    const [fileColumns, setFileColumns] = useState<{ key: string; label: string }[]>([]);
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [availableFiles, setAvailableFiles] = useState<IFileOption[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (open) {
            setStep('columns');
            setSummary('');
            const columns = Object.entries(template.properties.properties)
                .filter(([_, prop]) => prop.format === 'fileId' || prop.items?.format === 'fileId')
                .map(([key, prop]) => ({ key, label: prop.title }));
            setFileColumns(columns);
            setSelectedColumns(columns.map((c) => c.key));
        }
    }, [open, template]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(summary);
            toast.success(i18next.t('actions.copiedToClipboard'));
        } catch {
            toast.error(i18next.t('errors.copyFailed'));
        }
    };

    const toggleColumn = (key: string) => {
        setSelectedColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    };

    const toggleFile = (id: string) => {
        setSelectedFiles((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));
    };

    const moveToFilesStep = () => {
        const files: IFileOption[] = [];
        selectedRows.forEach((row) => {
            selectedColumns.forEach((colKey) => {
                const value = row.properties[colKey];
                if (value) {
                    if (Array.isArray(value)) {
                        value.forEach((v: string) => {
                            if (v) files.push({ id: v, name: getFileName(v) });
                        });
                    } else {
                        files.push({ id: value, name: getFileName(value) });
                    }
                }
            });
        });

        if (files.length === 0) {
            toast.error(i18next.t('errors.noFilesFound'));
            return;
        }

        setAvailableFiles(files);
        setSelectedFiles(files.map((f) => f.id));
        setStep('files');
    };

    const { isLoading, mutate: generateSummary } = useMutation(
        async () => {
            if (selectedFiles.length === 0) {
                throw new Error(i18next.t('errors.noFilesSelected'));
            }

            const filesToProcess: File[] = [];
            let skippedFiles = 0;

            for (const fileId of selectedFiles) {
                try {
                    const response = await axios.get(`${environment.api.storage}/${fileId}`, {
                        responseType: 'blob',
                    });
                    const blob = response.data as Blob;
                    if (blob.type === 'application/pdf') {
                        filesToProcess.push(new File([blob], `${fileId}.pdf`, { type: blob.type }));
                    } else {
                        skippedFiles++;
                    }
                } catch (err) {
                    console.error(`Failed to download file ${fileId}`, err);
                }
            }

            if (skippedFiles > 0) {
                toast.warning(i18next.t('actions.skippedNonPdfFiles', { count: skippedFiles }));
            }

            if (filesToProcess.length === 0) {
                throw new Error(i18next.t('errors.noPdfFilesFound'));
            }

            const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');
            return summarizeFilesRequest(filesToProcess, config?.aiSummaryRequestTimeout);
        },
        {
            onSuccess: (data: IAISummaryResponse) => {
                setSummary(data.summary);
                setStep('result');
            },
            onError: (error: any) => {
                toast.error(error.message || i18next.t('errors.summaryFailed'));
            },
        },
    );

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth disableEnforceFocus>
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 600,
                    fontSize: 20,
                    color: theme.palette.primary.main,
                }}
            >
                <Box display="flex" alignItems="center">
                    {step === 'files' && (
                        <IconButton onClick={() => setStep('columns')} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                    )}
                    {step === 'result' && (
                        <IconButton onClick={() => setStep('files')} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                    )}
                    {i18next.t('actions.aiSummary')}
                </Box>
                {step === 'result' && summary && (
                    <Tooltip title={i18next.t('actions.copyToClipboard')}>
                        <IconButton onClick={handleCopy} size="small">
                            <ContentCopy />
                        </IconButton>
                    </Tooltip>
                )}
            </DialogTitle>
            <DialogContent>
                {isLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                        <CircularProgress />
                    </Box>
                ) : step === 'result' ? (
                    <TextField
                        multiline
                        rows={12}
                        fullWidth
                        variant="outlined"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        sx={{ mt: 1 }}
                    />
                ) : step === 'columns' ? (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            {i18next.t('actions.selectColumnsTitle')}
                        </Typography>
                        <FormGroup>
                            {fileColumns.map((col) => (
                                <FormControlLabel
                                    key={col.key}
                                    control={<Checkbox checked={selectedColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} />}
                                    label={col.label}
                                />
                            ))}
                        </FormGroup>
                    </Box>
                ) : (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            {i18next.t('actions.selectFilesTitle')} ({selectedFiles.length})
                        </Typography>
                        <FormGroup>
                            {availableFiles.map((file) => (
                                <FormControlLabel
                                    key={file.id}
                                    control={<Checkbox checked={selectedFiles.includes(file.id)} onChange={() => toggleFile(file.id)} />}
                                    label={file.name}
                                />
                            ))}
                        </FormGroup>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ padding: '16px 24px' }}>
                <Button variant="outlined" onClick={handleClose} sx={{ borderRadius: '7px' }}>
                    {i18next.t('actions.close')}
                </Button>
                {!isLoading && step === 'columns' && (
                    <Button
                        variant="contained"
                        onClick={moveToFilesStep}
                        disabled={selectedColumns.length === 0}
                        sx={{ borderRadius: '7px', color: 'white' }}
                    >
                        {i18next.t('actions.next')}
                    </Button>
                )}
                {!isLoading && step === 'files' && (
                    <Button
                        variant="contained"
                        onClick={() => generateSummary()}
                        disabled={selectedFiles.length === 0}
                        sx={{ borderRadius: '7px', color: 'white' }}
                    >
                        {i18next.t('actions.generate')}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};
