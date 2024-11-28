import { styled, Typography } from '@mui/material';

const StepNumberTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep' }>(({ type, theme }) => ({
    height: '35px',
    width: '35px',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    borderRadius: '50px',
    justifyContent: 'center',
    marginRight: '1.5rem',
    fontSize: '15px',
    fontWeight: 700,
    ...(type === 'currentStep' && {
        backgroundColor: '#4752B6',
        color: 'white',
        boxShadow: '0px 1px 2px #00000029',
    }),
    ...(type === 'finishedStep' && {
        border: '2px solid #4752B6',
        color: theme.palette.primary.main,
        boxShadow: '0px 1px 2px #00000029',
    }),
    ...(type === 'futureStep' &&
        (theme.palette.mode === 'dark'
            ? {
                  backgroundColor: 'rgb(180, 180, 180, 0.3)',
                  color: '#282828',
              }
            : {
                  backgroundColor: '#E4E4E4',
                  color: '#5B5B5B',
              })),
}));

const StepNameTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep'; direction: 'row' | 'column' }>(
    ({ type, theme, direction }) => {
        let color;

        if (theme.palette.mode === 'dark') {
            color = type === 'finishedStep' ? '#8f919b' : 'white';
        } else {
            color = type === 'finishedStep' ? '#a1a5b7' : '#1E2775';
        }

        return {
            fontWeight: direction === 'column' ? 400 : 410,
            fontSize: direction === 'column' ? '14px' : '16px',
            color,
        };
    },
);

const StepDescriptionTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep' }>(({ type, theme }) => {
    let color;

    if (theme.palette.mode === 'dark') {
        color = type === 'finishedStep' ? '#787C9E' : '#787C9E';
    } else {
        color = type === 'finishedStep' ? '#787C9E' : '#787C9E';
    }

    return {
        fontWeight: 400,
        fontSize: '12px',
        color,
    };
});

const DashedHorizontalLine = styled('div')(({ theme }) => ({
    flexGrow: 1,
    margin: '15px',
    borderBottom: `2px solid ${theme.palette.mode === 'dark' ? 'rgb(200, 200, 200, 0.2)' : '#4752B6'}`,
}));

const DashedVerticalLine = styled('div')(({ theme }) => ({
    width: '2px',
    minHeight: '43px',
    margin: '15px',
    borderLeft: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(200, 200, 200, 0.2)' : '#4752B6'}`,
}));

export { StepNumberTypography, StepNameTypography, StepDescriptionTypography, DashedHorizontalLine, DashedVerticalLine };
