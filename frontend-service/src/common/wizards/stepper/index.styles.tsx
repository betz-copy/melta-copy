import { styled, Typography } from '@mui/material';

const StepNumberTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep' }>(({ type, theme }) => ({
    height: '35px',
    width: '35px',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    borderRadius: '50px',
    justifyContent: 'center',
    marginRight: '1rem',
    fontSize: '14px',
    fontWeight: 500,
    ...(type === 'currentStep' && {
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        boxShadow: '0px 1px 2px #00000029',
    }),
    ...(type === 'finishedStep' && {
        border: `2px solid ${theme.palette.primary.main}`,
        color: theme.palette.primary.main,
        boxShadow: '0px 1px 2px #00000029',
    }),
    ...(type === 'futureStep' && {
        backgroundColor: theme.palette.mode === 'dark' ? '#3B3F66' : '#CCCFE5',
        color: theme.palette.primary.main,
    }),
}));

const StepNameTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep'; direction: 'row' | 'column' }>(({
    type,
    theme,
    direction,
}) => {
    let color: string;

    switch (type) {
        case 'finishedStep':
        case 'currentStep':
            color = theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary;
            break;
        case 'futureStep':
            color = theme.palette.mode === 'dark' ? '#A7ABC7' : '#53566E';
            break;
    }

    return {
        fontWeight: type === 'currentStep' && direction === 'row' ? 500 : 400,
        fontSize: '14px',
        color,
    };
});

const StepDescriptionTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep' }>(({ type }) => {
    const color = type === 'finishedStep' ? '#787C9E' : '#787C9E';

    return {
        fontWeight: 400,
        fontSize: '12px',
        color,
    };
});

const DashedHorizontalLine = styled('div')(({ theme }) => ({
    flexGrow: 1,
    margin: '15px',
    borderBottom: `2px solid ${theme.palette.mode === 'dark' ? 'rgb(200, 200, 200, 0.2)' : theme.palette.primary.main}`,
}));

const DashedVerticalLine = styled('div')(({ theme }) => ({
    width: '2px',
    minHeight: '43px',
    margin: '15px',
    borderLeft: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(200, 200, 200, 0.2)' : theme.palette.primary.main}`,
}));

export { StepNumberTypography, StepNameTypography, StepDescriptionTypography, DashedHorizontalLine, DashedVerticalLine };
