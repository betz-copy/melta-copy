import React, { useState, CSSProperties } from 'react';
import IconButtonWithPopover from '../../common/IconButtonWithPopover';
import CreateProcess from '../../common/wizards/processInstance/CreateProcessDialog';

const AddProcessButton: React.FC<{
    style?: CSSProperties;
    disabled?: boolean;
    disabledToolTip?: boolean;
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
            {addNewProcessState && <CreateProcess open={addNewProcessState} onClose={handleClose} />}
        </>
    );
};

export { AddProcessButton };
