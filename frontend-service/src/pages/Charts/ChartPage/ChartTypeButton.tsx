import { useTheme } from '@mui/material';
import React from 'react';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { IChartType } from '../../../interfaces/charts';

const ChartTypeButton: React.FC<{
    icon: React.ElementType;
    buttonId: IChartType;
    selectedButton: string | null;
    handleClick: (buttonId: IChartType) => void;
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
            }}
            popoverText={popoverText}
        >
            <Icon fontSize="large" />
        </IconButtonWithPopover>
    );
};

export { ChartTypeButton };
