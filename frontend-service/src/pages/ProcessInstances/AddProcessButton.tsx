import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { CSSProperties, ReactNode, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { ErrorToast } from '../../common/ErrorToast';
import IconButtonWithPopover from '../../common/IconButtonWithPopover';
import CreateOrEditProcess from '../../common/wizards/processInstance/CreateOrEditProcessDialog';
import { ProcessDetailsValues } from '../../common/wizards/processInstance/ProcessDetails';
import { createProcessRequest } from '../../services/processesService';

const AddProcessButton: React.FC<{
    style?: CSSProperties;
    disabled?: boolean;
    disabledToolTip?: boolean;
    children?: ReactNode;
}> = ({ style, children, disabled }) => {
    const [addNewProcessState, setAddNewProcessState] = useState<boolean>(false);
    const handleOpen = () => {
        if (!disabled) {
            setAddNewProcessState(true);
        }
    };

    const handleClose = () => {
        setAddNewProcessState(false);
    };

    const queryClient = useQueryClient();

    const { mutateAsync } = useMutation((processData: ProcessDetailsValues) => createProcessRequest(processData), {
        onSuccess: () => {
            toast.success(i18next.t('processInstancesPage.processCreatedSuccessfully'));
            handleClose();
            queryClient.resetQueries({ queryKey: ['searchProcesses'] }); // reset ProcessesList search results
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('processInstancesPage.failedToCreateProcess')} />);
            console.error('Failed to create process. Error', error);
        },
    });

    return (
        <>
            <IconButtonWithPopover
                popoverText={disabled ? '' : ''} // only admin
                disabledToolTip={!disabled}
                iconButtonProps={{
                    onClick: async () => {
                        handleOpen();
                    },
                    style,
                    disableRipple: disabled,
                }}
                style={style}
            >
                {children}
            </IconButtonWithPopover>
            {addNewProcessState && <CreateOrEditProcess open={addNewProcessState} onClose={handleClose} mutateAsync={mutateAsync} />}
        </>
    );
};

export { AddProcessButton };
