import { useTheme } from '@mui/material';
import React from 'react';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';

const ChartTypeButton: React.FC<{
    icon: React.ElementType;
    buttonId: string;
    selectedButton: string | null;
    handleClick: (buttonId: string) => void;
    popoverText: string;
}> = ({ icon: Icon, buttonId, selectedButton, handleClick, popoverText }) => {
    const theme = useTheme();

    return (
        <IconButtonWithPopover
            iconButtonProps={{
                onClick: () => {
                    handleClick(buttonId);
                },
            }}
            style={{
                color: selectedButton === buttonId ? theme.palette.secondary.main : theme.palette.primary.main,
                borderRadius: '5px',
                padding: '8px',
            }}
            popoverText={popoverText}
        >
            <Icon fontSize="large" />
        </IconButtonWithPopover>
    );
};

export { ChartTypeButton };
