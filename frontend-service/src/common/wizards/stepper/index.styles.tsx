import { styled, Typography } from '@mui/material';

const StepNumberTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep' }>(({ type }) => ({
    height: '40px',
    width: '40px',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    borderRadius: '0.475rem',
    justifyContent: 'center',
    marginLeft: '1.5rem',
    ...(type === 'currentStep' && {
        backgroundColor: '#009ef7',
        color: 'white',
    }),
    ...(type === 'finishedStep' && {
        backgroundColor: '#f1faff',
        color: '#009ef7',
    }),
    ...(type === 'futureStep' && {
        backgroundColor: '#f1faff',
        color: '#009ef7',
    }),
}));

const StepNameTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep' }>(({ type }) => ({
    fontWeight: 600,
    fontSize: '1.25rem',
    color: type === 'finishedStep' ? '#a1a5b7' : '#3f4254',
}));

const DashedVerticalLine = styled('div')({
    borderRight: '2px dashed #e4e6ef',
    height: '40px',
    marginRight: '18px',
    left: '50%',
});

export { StepNumberTypography, StepNameTypography, DashedVerticalLine };
