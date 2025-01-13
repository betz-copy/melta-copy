import { ChevronLeft, ExpandMore } from '@mui/icons-material';
import { Button, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { IUser } from '@microservices/shared-interfaces';
import { environment } from '../../../../globals';

interface StepReviewersProps {
    reviewers: IUser[];
}

export const StepReviewers: React.FC<StepReviewersProps> = ({ reviewers }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Grid container>
            <Grid item>
                <Button
                    onClick={(event) => {
                        event.preventDefault();
                        setIsOpen(!isOpen);
                        event.stopPropagation();
                    }}
                >
                    {isOpen ? <ExpandMore fontSize="small" /> : <ChevronLeft fontSize="small" />}

                    <Typography>{i18next.t('wizard.processTemplate.approvers')}</Typography>
                </Button>
            </Grid>
            {isOpen &&
                reviewers.map((reviewer) => (
                    <Grid item key={reviewer._id}>
                        <Typography
                            style={{
                                fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                width: '270px',
                            }}
                        >
                            {reviewer.displayName}
                        </Typography>
                    </Grid>
                ))}
        </Grid>
    );
};
