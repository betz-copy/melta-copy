import { Grid, TextField, Typography } from '@mui/material';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import i18next from 'i18next';
import React from 'react';
import { AreYouSureDialog } from '../dialogs/AreYouSureDialog';

interface DeleteEntitiesDialogProps {
    open: boolean;
    handleClose: () => void;
    onYes: () => void;
    isLoading: boolean;
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    value: string;
    setValue: (value: string) => void;
}

export const DeleteEntitiesDialog: React.FC<DeleteEntitiesDialogProps> = ({
    open,
    handleClose,
    onYes,
    isLoading,
    entityTemplate,
    value,
    setValue,
}) => (
    <AreYouSureDialog
        open={open}
        handleClose={handleClose}
        onYes={onYes}
        isLoading={isLoading}
        body={
            <Grid container direction="column" alignItems="center">
                <Typography marginBottom={2} textAlign="center">
                    {i18next.t('wizard.entity.typeEntityTemplateForConfirmDelete', {
                        displayName: entityTemplate.displayName,
                    })}
                </Typography>
                <TextField sx={{ width: '300px' }} value={value} onChange={(e) => setValue(e.target.value)} />
            </Grid>
        }
        disableYesButton={entityTemplate.displayName !== value}
    />
);
