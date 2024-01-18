import React, { useState } from 'react';
import { Button, Grid, Typography, useTheme } from '@mui/material';
import { CustomIcon } from '../../../../common/CustomIcon';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import { ProcessProperties } from './ProcessProperties';
import { StepReviewers } from './StepReviewers';

interface StepProps {
    step: IMongoStepTemplatePopulated;
}

export const ProcessStep: React.FC<StepProps> = ({ step }) => {
    const theme = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Grid item container direction="row" marginLeft="20px">
            <Grid item container direction="row" alignItems="center" gap="10px">
                <Button
                    style={{ maxWidth: '250px' }}
                    onClick={(event) => {
                        event.preventDefault();
                        setIsOpen(!isOpen);
                        event.stopPropagation();
                    }}
                >
                    {isOpen ? (
                        <img style={{ marginLeft: '10px' }} src="/icons/Close-Arrow.svg" />
                    ) : (
                        <img style={{ marginLeft: '10px' }} src="/icons/Open-Arrow.svg" />
                    )}
                    {step.iconFileId && <CustomIcon iconUrl={step.iconFileId} height="24px" width="24px" color={theme.palette.primary.main} />}
                    <MeltaTooltip title={step.displayName}>
                        <Typography
                            style={{
                                color: '#9398C2',
                                fontWeight: '400',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                maxWidth: '250px',
                                textAlign: 'right',
                                marginRight: '5px',
                            }}
                        >
                            {step.displayName}
                        </Typography>
                    </MeltaTooltip>
                </Button>
            </Grid>
            {isOpen && (
                <Grid item container direction="column" marginLeft="20px">
                    <ProcessProperties properties={step.properties.properties} />
                    <StepReviewers reviewers={step.reviewers} />
                </Grid>
            )}
        </Grid>
    );
};
