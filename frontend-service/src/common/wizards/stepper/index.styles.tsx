import { styled, Typography } from '@mui/material';

const StepNumberTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep' }>(({ type }) => ({
    height: '40px',
    width: '40px',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    borderRadius: '50px',
    justifyContent: 'center',
    marginRight: '1.5rem',
    ...(type === 'currentStep' && {
        backgroundColor: '#1B7BB9',
        color: 'white',
        boxShadow: '0px 1px 2px #00000029',
    }),
    ...(type === 'finishedStep' && {
        // backgroundColor: '#f1faff',
        border: '2px solid  #009ef7',
        color: '#009ef7',
        boxShadow: '0px 1px 2px #00000029',
    }),
    ...(type === 'futureStep' && {
        backgroundColor: '#E4E4E4',
        color: '#5B5B5B',
    }),
}));

const StepNameTypography = styled(Typography)<{ type: 'currentStep' | 'finishedStep' | 'futureStep' }>(({ type }) => ({
    fontWeight: 500,
    fontSize: '1.25rem',
    color: type === 'finishedStep' ? '#a1a5b7' : '#3f4254',
}));

const DashedHorizontalLine = styled('div')({
    flexGrow: 1,
    margin: '30px',
    borderBottom: '2px solid #e4e6ef',
});

export { StepNumberTypography, StepNameTypography, DashedHorizontalLine };
