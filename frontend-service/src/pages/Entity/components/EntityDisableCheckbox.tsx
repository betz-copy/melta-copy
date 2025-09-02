import React from 'react';
import { Grid, FormControlLabel, Checkbox } from '@mui/material';
import { CircleRounded } from '@mui/icons-material';
import i18next from 'i18next';

const EntityDisableCheckbox: React.FC<{ isEntityDisabled: boolean }> = ({ isEntityDisabled }) => {
    return (
        <Grid fontSize="5px">
            <FormControlLabel
                control={
                    <Checkbox
                        checked={!isEntityDisabled}
                        checkedIcon={<CircleRounded color="success" fontSize="small" style={{ height: '10px', width: '10px' }} />}
                        icon={<CircleRounded fontSize="small" color="error" style={{ height: '10px', width: '10px' }} />}
                    />
                }
                label={(isEntityDisabled ? i18next.t('entityPage.disable') : i18next.t('entityPage.active')) as string}
            />
        </Grid>
    );
};

export { EntityDisableCheckbox };
