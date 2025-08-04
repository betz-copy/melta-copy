import { LoadingButton } from '@mui/lab';
import { Button, Dialog, Grid, TextField } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { ErrorToast } from '../../common/ErrorToast';
import BlueTitle from '../../common/MeltaDesigns/BlueTitle';
import { createGantt } from '../../services/ganttsService';

type ICreateGanttDialogProps = {
    open: boolean;
    onClose: () => void;
};

export const CreateGanttDialog: React.FC<ICreateGanttDialogProps> = ({ open, onClose }) => {
    const [name, setName] = useState('');

    const onCloseWrapper = () => {
        setName('');
        onClose();
    };

    const { mutateAsync: createGanttMutateAsync, isLoading } = useMutation(() => createGantt({ name, items: [] }), {
        onSuccess: () => {
            toast.success(i18next.t('gantts.actions.createdSuccessfully'));
            onCloseWrapper();
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('gantts.actions.failedToCreate')} />);
            onCloseWrapper();
        },
    });

    return (
        <Dialog open={open}>
            <Grid container direction="column" padding="1rem" alignItems="center" spacing={2}>
                <Grid item>
                    <BlueTitle title={i18next.t('gantts.actions.createGantt')} component="h6" variant="h6" />
                </Grid>

                <Grid item>
                    <TextField value={name} onChange={(event) => setName(event.target.value)} placeholder={i18next.t('gantts.actions.name')} />
                </Grid>

                <Grid container item justifyContent="space-evenly">
                    <Button disabled={isLoading} onClick={onCloseWrapper}>
                        {i18next.t('gantts.actions.cancel')}
                    </Button>
                    <LoadingButton type="submit" loading={isLoading} onClick={() => createGanttMutateAsync()}>
                        {i18next.t('gantts.actions.save')}
                    </LoadingButton>
                </Grid>
            </Grid>
        </Dialog>
    );
};
