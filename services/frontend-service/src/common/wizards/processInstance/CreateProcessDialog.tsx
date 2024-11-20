import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import CloseIcon from '@mui/icons-material/Close';
import i18next from 'i18next';
import { IProcessTemplateMap } from '@microservices/shared';
import ProcessDetails, { ProcessDetailsValues } from './ProcessDetails';
import { useProcessDetailsFormik } from './ProcessDetails/detailsFormik';
import { createProcessRequest } from '../../../services/processesService';
import { BlueTitle } from '../../BlueTitle';
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
        onError: (error: AxiosError<{ metadata: { errorCode: string } }>) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('processInstancesPage.failedToCreateProcess')} />);
            console.log('Failed to create process. Error', error);
        },
    });

    const detailsFormikData = useProcessDetailsFormik(undefined, processTemplatesMap, mutateAsync);

    return (
        <Dialog open={open} fullWidth maxWidth="xl" PaperProps={{ style: { height: '85vh' } }}>
            <DialogTitle margin={1}>
                <BlueTitle title={i18next.t('processInstancesPage.addNewProcess')} variant="h4" component="symbol" />
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
