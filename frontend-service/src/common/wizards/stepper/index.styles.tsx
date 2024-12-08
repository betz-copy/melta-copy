import { styled, Typography } from '@mui/material';

const StepNumberTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep'; direction: 'row' | 'column' }>(
    ({ type, direction, theme }) => ({
        height: direction === 'row' ? '40px' : '35px',
        width: direction === 'row' ? '40px' : '35px',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        borderRadius: '50px',
        justifyContent: 'center',
        marginRight: direction === 'row' ? '1.5rem' : '1rem',
        fontSize: '15px',
        fontWeight: 700,
        ...(type === 'currentStep' && {
            backgroundColor: direction === 'row' ? theme.palette.primary.main : '#4752B6',
            color: 'white',
            boxShadow: '0px 1px 2px #00000029',
        }),
        ...(type === 'finishedStep' && {
            border: `2px solid ${direction === 'row' ? theme.palette.primary.main : '#4752B6'}`,
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
    }),
);

const StepNameTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep'; direction: 'row' | 'column' }>(
    ({ type, theme, direction }) => {
        let color;

        if (theme.palette.mode === 'dark') {
            color = type === 'finishedStep' ? '#8f919b' : 'white';
        } else {
            // eslint-disable-next-line no-nested-ternary
            color = type === 'finishedStep' ? '#a1a5b7' : direction === 'row' ? '#3f4254' : '#1E2775';
        }

        return {
            fontWeight: direction === 'row' ? 500 : 400,
            fontSize: direction === 'row' ? '1.25rem' : '14px',
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
    borderBottom: `2px solid ${theme.palette.mode === 'dark' ? 'rgb(200, 200, 200, 0.2)' : '#e4e6ef'}`,
}));

const DashedVerticalLine = styled('div')(({ theme }) => ({
    width: '2px',
    minHeight: '43px',
    margin: '15px',
    borderLeft: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(200, 200, 200, 0.2)' : '#4752B6'}`,
}));

export { StepNumberTypography, StepNameTypography, StepDescriptionTypography, DashedHorizontalLine, DashedVerticalLine };
