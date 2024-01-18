import React from 'react';
import styled from '@emotion/styled';
import { StepConnector, stepConnectorClasses, StepIconProps } from '@mui/material';
import { lightTheme } from '../../../../theme';

const StyleStepIconRoot = styled('div')<{ ownerState: { active?: boolean } }>(() => ({
    display: 'flex',
    height: 133,
    alignItems: 'center',
    '& .StepIcon': {
        width: 10,
        height: 10,
        borderRadius: '50%',
        transition: 'background-color 0.3s ease-in-out, border-color 0.3s ease-in-out',
    },
    '& .completed': {
        border: `2px solid ${lightTheme.palette.primary.main}`,
    },
    '& .active': {
        backgroundColor: lightTheme.palette.primary.main,
    },
    '& .inactive': {
        border: '2px solid gray',
    },
    '&:hover .StepIcon': {
        border: `2px solid ${lightTheme.palette.primary.main}`,
    },
}));

export const StyleStepperConnector: React.FC = styled(StepConnector)(() => ({
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            backgroundColor: lightTheme.palette.primary.main,
        },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            backgroundColor: lightTheme.palette.primary.main,
        },
    },
    [`& .${stepConnectorClasses.lineVertical}`]: {
        width: 2,
        height: 139,
        border: 0,
        backgroundColor: '#bfbfbf',
        margin: '-70px 0 0 -8px',
        position: 'absolute',
    },
}));

export const StyleStepIcon: React.FC<StepIconProps> = ({ active, completed, className }) => {
    return (
        <StyleStepIconRoot ownerState={{ active }} className={className}>
            {completed && <div className="StepIcon completed" />}
            {!completed && active && <div className="StepIcon active" />}
            {!completed && !active && <div className="StepIcon inactive" />}
        </StyleStepIconRoot>
    );
};
