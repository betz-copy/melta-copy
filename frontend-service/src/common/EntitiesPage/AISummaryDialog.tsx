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
import { IChildTemplatePopulated } from '@packages/child-template';
import { IMongoEntityTemplatePopulated, PropertyFormat } from '@packages/entity-template';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import axios from '../../axios';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { environment } from '../../globals';
import { AISummaryResponse, FileOption, Step } from '../../interfaces/ai';
import { summarizeFilesRequest } from '../../services/aiSummaryService';
import { BackendConfigState } from '../../services/backendConfigService';
import { getFileName } from '../../utils/getFileName';

interface AISummaryDialogProps {
    open: boolean;
    handleClose: () => void;
    template: IMongoEntityTemplatePopulated | IChildTemplatePopulated;
    // biome-ignore lint/suspicious/noExplicitAny: selectedRows is any[]
    selectedRows: any[];
}

export const AISummaryDialog: React.FC<AISummaryDialogProps> = ({ open, handleClose, template, selectedRows }) => {
    const theme = useTheme();
    const [step, setStep] = useState<Step>(Step.Columns);
    const [summary, setSummary] = useState<string>('');
    const [fileColumns, setFileColumns] = useState<{ key: string; label: string }[]>([]);
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [availableFiles, setAvailableFiles] = useState<FileOption[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

    const queryClient = useQueryClient();
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');

    useEffect(() => {
        if (open) {
            setStep(Step.Columns);
            setSummary('');
            const columns = Object.entries(template.properties.properties).reduce<Array<{ key: string; label: string }>>((acc, [key, prop]) => {
                if (prop.format === PropertyFormat.fileId || prop.items?.format === PropertyFormat.fileId) {
                    acc.push({ key, label: prop.title });
                }
                return acc;
            }, []);
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
        const files: FileOption[] = selectedRows.flatMap((row) =>
            selectedColumns.flatMap((colKey) => {
                const value = row.properties[colKey];
                if (!value) return [];

                const values = Array.isArray(value) ? value : [value];

                return values.filter((v): v is string => Boolean(v)).map((v) => ({ id: v, name: getFileName(v) }));
            }),
        );

        if (!files.length) {
            toast.error(i18next.t('errors.noFilesFound'));
            return;
        }

        setAvailableFiles(files);
        setSelectedFiles(files.map((f) => f.id));
        setStep(Step.Files);
    };

    const { isLoading, mutate: generateSummary } = useMutation(
        async () => {
            if (!selectedFiles.length) throw new Error(i18next.t('errors.noFilesSelected'));

            const results = await Promise.allSettled(
                selectedFiles.map(async (fileId) => {
                    const { data: blob } = await axios.get<Blob>(`${environment.api.storage}/${fileId}`, { responseType: 'blob' });
                    return { fileId, blob };
                }),
            );

            const filesToProcess: File[] = [];
            let skippedFiles = 0;

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const { fileId, blob } = result.value;
                    if (blob.type === 'application/pdf') {
                        filesToProcess.push(new File([blob], `${fileId}.pdf`, { type: blob.type }));
                    } else skippedFiles++;
                } else console.error(`Failed to download file ${selectedFiles[index]}`, result.reason);
            });

            if (skippedFiles > 0) toast.warning(i18next.t('actions.skippedNonPdfFiles', { count: skippedFiles }));

            if (!filesToProcess.length) throw new Error(i18next.t('errors.noPdfFilesFound'));

            return summarizeFilesRequest(filesToProcess, config?.aiRequestTimeout);
        },
        {
            onSuccess: (data: AISummaryResponse) => {
                setSummary(data.summary);
                setStep(Step.Result);
            },
            onError: (error: Error) => {
                toast.error(error.message || i18next.t('errors.summaryFailed'));
            },
        },
    );

    const handleCloseRequest = () => {
        if (step === Step.Result && summary) {
            setIsConfirmCloseOpen(true);
        } else {
            handleClose();
        }
    };

    const confirmClose = () => {
        setIsConfirmCloseOpen(false);
        handleClose();
    };

    return (
        <>
            <Dialog open={open} onClose={handleCloseRequest} maxWidth="md" fullWidth disableEnforceFocus>
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
                        {step === Step.Files && (
                            <IconButton onClick={() => setStep(Step.Columns)} sx={{ mr: 1 }}>
                                <ArrowBack />
                            </IconButton>
                        )}
                        {step === Step.Result && (
                            <IconButton onClick={() => setStep(Step.Files)} sx={{ mr: 1 }}>
                                <ArrowBack />
                            </IconButton>
                        )}
                        {i18next.t('actions.aiSummary')}
                    </Box>
                    {step === Step.Result && summary && (
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
                    ) : step === Step.Result ? (
                        <TextField
                            multiline
                            rows={12}
                            fullWidth
                            variant="outlined"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            sx={{ mt: 1 }}
                        />
                    ) : step === Step.Columns ? (
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
                    <Button variant="outlined" onClick={handleCloseRequest} sx={{ borderRadius: '7px' }}>
                        {i18next.t('actions.close')}
                    </Button>
                    {!isLoading && step === Step.Columns && (
                        <Button
                            variant="contained"
                            onClick={moveToFilesStep}
                            disabled={selectedColumns.length === 0}
                            sx={{ borderRadius: '7px', color: 'white' }}
                        >
                            {i18next.t('actions.next')}
                        </Button>
                    )}
                    {!isLoading && step === Step.Files && (
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

            <AreYouSureDialog
                open={isConfirmCloseOpen}
                handleClose={() => setIsConfirmCloseOpen(false)}
                onYes={confirmClose}
                title={i18next.t('actions.aiSummaryCloseConfirmationTitle')}
                body={i18next.t('actions.aiSummaryCloseConfirmationBody')}
            />
        </>
    );
};
