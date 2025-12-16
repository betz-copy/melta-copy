import { IChartType } from '@microservices/shared';
import { useTheme } from '@mui/material';
import React from 'react';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';

const ChartTypeButton: React.FC<{
    icon: React.ElementType;
    buttonId: IChartType;
    selectedButton: string | null;
    handleClick: (buttonId: IChartType) => void;
    popoverText: string;
    disabled: boolean;
}> = ({ icon: Icon, buttonId, selectedButton, handleClick, popoverText, disabled }) => {
    const theme = useTheme();

    return (
        <IconButtonWithPopover
            iconButtonProps={{
                onClick: () => handleClick(buttonId),
            }}
            style={{
                color: selectedButton === buttonId ? theme.palette.secondary.main : theme.palette.primary.main,
                borderRadius: '5px',
            }}
            popoverText={popoverText}
            disabled={disabled}
        >
            <Icon fontSize="large" />
        </IconButtonWithPopover>
    );
};

export { ChartTypeButton };
