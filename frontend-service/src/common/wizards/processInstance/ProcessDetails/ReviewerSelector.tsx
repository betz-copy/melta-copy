import { Chip, Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { IUser } from '../../../../interfaces/users';
import { useDarkModeStore } from '../../../../stores/darkMode';
import UserAutocomplete from '../../../inputs/UserAutocomplete';

interface ReviewerSelectorProps {
    forcedReviewers?: IUser[];
    reviewers: IUser[];
    onAdd: (newReviewer: IUser, reviewers: IUser[]) => void;
    onRemove: (removedReviewer: IUser, reviewers: IUser[]) => void;
    isViewMode?: boolean;
    disableAddingReviewers?: boolean;
}

export const ReviewerSelector: React.FC<ReviewerSelectorProps> = ({
    forcedReviewers = [],
    reviewers,
    onAdd,
    onRemove,
    isViewMode = false,
    disableAddingReviewers = false,
}) => {
    const [displayValue, setDisplayValue] = useState('');
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const combinedReviewers = [...forcedReviewers, ...reviewers];

    return (
        <Grid container direction="column" paddingBottom={2} paddingLeft={2} spacing={2}>
            {!isViewMode && !disableAddingReviewers && (
                <Grid paddingBottom="1rem" paddingRight={2}>
                    <UserAutocomplete
                        mode="internal"
                        value={null}
                        displayValue={displayValue}
                        onChange={(_, selectedUser, reason) => {
                            if (reason !== 'selectOption' || !selectedUser) return;
                            onAdd(selectedUser as IUser, reviewers);
                            setDisplayValue('');
                        }}
                        onDisplayValueChange={(_, newDisplayValue) => setDisplayValue(newDisplayValue)}
                        isOptionDisabled={(option) => combinedReviewers.some((approver) => approver._id === (option as IUser)._id)}
                        isError={false}
                        label={i18next.t('wizard.processInstance.addReviewer')}
                        size="small"
                    />
                </Grid>
            )}
            <Grid
                container
                direction="column"
                spacing={1}
                flexWrap="nowrap"
                sx={{
                    overflowY: 'auto',
                    maxHeight: isViewMode || disableAddingReviewers ? '190px' : '110px',
                    '&::-webkit-scrollbar': {
                        width: '3px',
                    },
                }}
            >
                {forcedReviewers?.map((reviewer) => (
                    <Grid key={reviewer._id}>
                        <Chip label={reviewer.fullName} sx={{ backgroundColor: darkMode ? '#818181' : '#c5c6d4' }} disabled />
                    </Grid>
                ))}
                {reviewers?.map((reviewer) => (
                    <Grid key={reviewer._id}>
                        {isViewMode ? (
                            <Chip label={reviewer.fullName} sx={{ backgroundColor: darkMode ? '#818181' : '#E0E1ED' }} />
                        ) : (
                            <Chip
                                label={reviewer.fullName}
                                sx={{ backgroundColor: darkMode ? '#818181' : '#E0E1ED' }}
                                onDelete={() => onRemove(reviewer, reviewers)}
                            />
                        )}
                    </Grid>
                ))}
            </Grid>
        </Grid>
    );
};
