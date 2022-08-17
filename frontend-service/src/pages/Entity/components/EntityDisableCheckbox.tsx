import React from 'react';
import { Grid, Checkbox, FormControlLabel } from '@mui/material';
import { CircleRounded } from '@mui/icons-material';
import i18next from 'i18next';

const EntityDisableCheckbox: React.FC<{ isEntityDisabled: boolean }> = ({ isEntityDisabled }) => {
    return (
        <Grid item>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={!isEntityDisabled}
                        checkedIcon={<CircleRounded color="success" fontSize="small" />}
                        icon={<CircleRounded fontSize="small" color="error" />}
                    />
                }
                label={(isEntityDisabled ? i18next.t('entityPage.disable') : i18next.t('entityPage.active')) as string}
            />
        </Grid>
    );
};

export { EntityDisableCheckbox };
