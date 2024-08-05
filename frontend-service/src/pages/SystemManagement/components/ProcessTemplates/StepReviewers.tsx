import React, { useState } from 'react';
import { Button, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IUser } from '../../../../interfaces/users';
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
                    {isOpen ? (
                        <img style={{ marginLeft: '10px' }} src="/icons/Close-Arrow.svg" />
                    ) : (
                        <img style={{ marginLeft: '10px' }} src="/icons/Open-Arrow.svg" />
                    )}
                    <Typography color="#9398C2">{i18next.t('wizard.processTemplate.approvers')}</Typography>
                </Button>
            </Grid>
            {isOpen &&
                reviewers.map((reviewer) => (
                    <Grid item key={reviewer._id}>
                        <Typography
                            style={{
                                fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
                                color: '#53566E',
                                fontWeight: '400',
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
