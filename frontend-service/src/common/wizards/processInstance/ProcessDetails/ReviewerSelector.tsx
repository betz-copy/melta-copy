import React from 'react';
import { Chip, Grid } from '@mui/material';
import i18next from 'i18next';
import { IUser } from '../../../../services/kartoffelService';
import UserAutocomplete from '../../../inputs/UserAutocomplete';

interface ReviewerSelectorProps {
    forcedReviewers?: IUser[];
    reviewers: IUser[];
    onAdd: (newReviewer: IUser, reviewers: IUser[]) => void;
    onRemove: (removedReviewer: IUser, reviewers: IUser[]) => void;
    isViewMode?: boolean;
}

export const ReviewerSelector: React.FC<ReviewerSelectorProps> = ({ forcedReviewers = [], reviewers, onAdd, onRemove, isViewMode = false }) => {
    const [displayValue, setDisplayValue] = React.useState('');

    const combinedReviewers = [...forcedReviewers, ...reviewers];

    return (
        <Grid container direction="column" paddingBottom={2} paddingLeft={2} spacing={2}>
            {!isViewMode && (
                <Grid item paddingBottom="1rem" paddingRight={2}>
                    <UserAutocomplete
                        value={null}
                        displayValue={displayValue}
                        onChange={(_, selectedUser, reason) => {
                            if (reason !== 'selectOption' || !selectedUser) return;
                            onAdd(selectedUser, reviewers);
                            setDisplayValue('');
                        }}
                        onDisplayValueChange={(_, newDisplayValue) => setDisplayValue(newDisplayValue)}
                        isOptionDisabled={(option) => combinedReviewers.some((approver) => approver.id === option.id)}
                        isError={false}
                        label={i18next.t('wizard.processInstance.addReviewer')}
                        size="small"
                    />
                </Grid>
            )}
            <Grid
                item
                container
                direction="column"
                spacing={1}
                flexWrap="nowrap"
                sx={{
                    overflowY: 'auto',
                    maxHeight: !isViewMode ? '140px' : '160px',
                    '&::-webkit-scrollbar': {
                        width: '3px',
                    },
                }}
            >
                {forcedReviewers?.map((reviewer) => (
                    <Grid item key={reviewer.id}>
                        <Chip label={reviewer.fullName} variant="outlined" disabled />
                    </Grid>
                ))}
                {reviewers?.map((reviewer) => (
                    <Grid item key={reviewer.id}>
                        {isViewMode ? (
                            <Chip label={reviewer.fullName} variant="outlined" />
                        ) : (
                            <Chip label={reviewer.fullName} variant="outlined" onDelete={() => onRemove(reviewer, reviewers)} />
                        )}
                    </Grid>
                ))}
            </Grid>
        </Grid>
    );
};
