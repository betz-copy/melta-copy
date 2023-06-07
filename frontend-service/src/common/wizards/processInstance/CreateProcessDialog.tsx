import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import ProcessDetails, { ProcessDetailsValues } from './ProcessDetails';
import { IProcessTemplateMap } from '../../../interfaces/processes/processTemplate';
import { useMutation, useQueryClient } from 'react-query';
import { useProcessDetailsFormik } from './ProcessDetails/detailsFormik';
import { createProcessRequest } from '../../../services/processesService';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { BlueTitle } from '../../BlueTitle';
import CloseIcon from '@mui/icons-material/Close';
import i18next from 'i18next';
import { ErrorToast } from '../../ErrorToast';

interface ISimpleDialogProps {
    open: boolean;
    onClose: () => void;
}

const CreateProcess: React.FC<ISimpleDialogProps> = ({ open, onClose }) => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;

    const { mutateAsync } = useMutation((processData: ProcessDetailsValues) => createProcessRequest(processData), {
        onSuccess: () => {
            toast.success(i18next.t('processInstancesPage.processCreatedSuccessfully'));
            onClose();
            queryClient.resetQueries({ queryKey: ['searchProcesses'] }); // reset ProcessesList search results
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('processInstancesPage.failedToCreateProcess')} />);
            console.log('Failed to create process. Error', error);
        },
    });

    const detailsFormikData = useProcessDetailsFormik(undefined, processTemplatesMap, mutateAsync);

    return (
        <Dialog open={open} fullWidth maxWidth="xl" PaperProps={{ style: { height: '80vh' } }}>
            <DialogTitle margin={1}>
                <BlueTitle title={i18next.t('processInstancesPage.addNewProcess')} variant="h4" component={'symbol'} />
                <IconButton
                    aria-label="close"
                    onClick={() => {
                        onClose();
                        detailsFormikData.resetForm();
                    }}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon fontSize="large" />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ padding: 5 }}>
                <ProcessDetails detailsFormikData={detailsFormikData} />
            </DialogContent>
        </Dialog>
    );
};

export default CreateProcess;
