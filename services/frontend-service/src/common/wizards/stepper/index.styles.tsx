import { styled, Typography } from '@mui/material';

const StepNumberTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep' }>(({ type, theme }) => ({
    height: '40px',
    width: '40px',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    borderRadius: '50px',
    justifyContent: 'center',
    marginRight: '1.5rem',
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

const StepNameTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep' }>(({ type, theme }) => {
    let color;

    if (theme.palette.mode === 'dark') {
        color = type === 'finishedStep' ? '#8f919b' : 'white';
    } else {
        color = type === 'finishedStep' ? '#a1a5b7' : '#3f4254';
    }

    return {
        fontWeight: 500,
        fontSize: '1.25rem',
        color,
    };
});

const DashedHorizontalLine = styled('div')(({ theme }) => ({
    flexGrow: 1,
    margin: '15px',
    borderBottom: `2px solid ${theme.palette.mode === 'dark' ? 'rgb(200, 200, 200, 0.2)' : '#e4e6ef'}`,
}));

export { StepNumberTypography, StepNameTypography, DashedHorizontalLine };
