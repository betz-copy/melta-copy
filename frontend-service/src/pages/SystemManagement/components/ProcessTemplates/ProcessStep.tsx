import { ChevronLeft, ExpandMore, ScatterPlotOutlined as HiveIcon } from '@mui/icons-material';
import { Button, Grid, Typography, useTheme } from '@mui/material';
import { IMongoStepTemplatePopulated } from '@packages/process';
import React, { useState } from 'react';
import { CustomIcon } from '../../../../common/CustomIcon';
import MeltaTooltip from '../../../../common/MeltaDesigns/MeltaTooltip';
import { ProcessProperties } from './ProcessProperties';
import { StepReviewers } from './StepReviewers';

interface StepProps {
    step: IMongoStepTemplatePopulated;
}

export const ProcessStep: React.FC<StepProps> = ({ step }) => {
    const theme = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Grid container direction="row" marginLeft="20px">
            <Grid container direction="row" alignItems="center" gap="10px">
                <Button
                    style={{ maxWidth: '250px' }}
                    onClick={(event) => {
                        event.preventDefault();
                        setIsOpen(!isOpen);
                        event.stopPropagation();
                    }}
                >
                    {isOpen ? <ExpandMore fontSize="small" /> : <ChevronLeft fontSize="small" />}

                    {step.iconFileId ? (
                        <CustomIcon iconUrl={step.iconFileId} height="24px" width="24px" color={theme.palette.primary.main} />
                    ) : (
                        <HiveIcon sx={{ color: theme.palette.primary.main }} height="24px" width="24px" />
                    )}
                    <MeltaTooltip title={step.displayName}>
                        <Typography
                            style={{
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
                <Grid container direction="column" marginLeft="20px">
                    <ProcessProperties properties={step.properties.properties} />
                    <StepReviewers reviewers={step.reviewers} />
                </Grid>
            )}
        </Grid>
    );
};
