import React, { useState } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Box,
    Button,
    Grid,
    IconButton,
    Typography,
    Select,
    MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import i18next from 'i18next';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

interface IFieldFilter {
    fieldValue: IEntitySingleProperty;
    selected: boolean;
    filterValue?: any;
}

interface IAddFieldFilterDialogProps {
    open: boolean;
    onClose: () => void;
    fieldFilters: Record<string, IFieldFilter>;
    setFieldFilters: (fieldFilters: Record<string, IFieldFilter>) => void;
    entityTemplate: IMongoEntityTemplatePopulated;
    currentFieldName: string;
}

const AddFieldFilterDialog: React.FC<IAddFieldFilterDialogProps> = ({
    open,
    onClose,
    fieldFilters,
    setFieldFilters,
    entityTemplate,
    currentFieldName,
}) => {
    const [fieldType, setFieldType] = useState('');

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography>{i18next.t('createChildTemplateDialog.fieldFilterDialog.title')}</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Select fullWidth disabled value={currentFieldName} onChange={(e) => setFieldType(e.target.value)} displayEmpty>
                            <MenuItem value={currentFieldName}>{currentFieldName}</MenuItem>
                        </Select>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Grid container spacing={2} alignItems="center">
                    <Grid xs={12} item display="flex" justifyContent="center" alignItems="center">
                        <Button onClick={onClose} variant="contained" color="primary">
                            {i18next.t('createChildTemplateDialog.fieldFilterDialog.addFilter')}
                        </Button>
                    </Grid>
                </Grid>
            </DialogActions>
        </Dialog>
    );
};

export default AddFieldFilterDialog;
