import React from 'react';
import { Button, Grid } from '@mui/material';
import i18next from 'i18next';

interface FieldButtonsProps {
    handleUpdate: () => void;
    isModified: boolean;
    handleReset: () => void;
    isValueDifferentFromDefault: boolean;
}

const FieldButtons: React.FC<FieldButtonsProps> = ({ handleUpdate, isModified, handleReset, isValueDifferentFromDefault }) => {
    return (
        <Grid container direction="row" justifyContent="space-between" alignItems="center" flexWrap="nowrap">
            <Button variant="contained" color="primary" onClick={handleUpdate} sx={{ fontSize: '12px' }} disabled={!isModified}>
                {i18next.t('schedule.schedule.updateButton')}
            </Button>
            <Button variant="contained" color="primary" onClick={handleReset} sx={{ fontSize: '12px' }} disabled={!isValueDifferentFromDefault}>
                {i18next.t('schedule.schedule.resetButton')}
            </Button>
        </Grid>
    );
};

export default FieldButtons;
