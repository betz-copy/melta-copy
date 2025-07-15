import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, Autocomplete } from '@mui/material';
import i18next from 'i18next';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

interface SelectUserFieldDialogProps {
    open: boolean;
    userFields: string[];
    selectedField: string | null;
    onClose: () => void;
    onSubmit: (field: string) => void;
    entityTemplate: IMongoEntityTemplatePopulated;
    title?: string;
    content?: string;
    label?: string;
}

const SelectUserFieldDialog: React.FC<SelectUserFieldDialogProps> = ({
    open,
    userFields,
    selectedField,
    onClose,
    onSubmit,
    entityTemplate,
    title,
    content,
    label,
}) => {
    const [value, setValue] = useState<string | null>(selectedField);

    useEffect(() => {
        setValue(selectedField);
    }, [selectedField]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle color={(theme) => theme.palette.primary.main} sx={{ fontSize: '16px', fontWeight: 400 }}>
                {title || i18next.t('createChildTemplateDialog.selectUserDialog.title')}
            </DialogTitle>
            <DialogContent>
                <Typography sx={{ fontSize: '14px', mb: 2 }}>{content || i18next.t('createChildTemplateDialog.selectUserDialog.description')}</Typography>
                <Autocomplete
                    options={userFields}
                    getOptionLabel={(field) => entityTemplate.properties.properties[field].title}
                    value={value}
                    onChange={(_event, newVal) => setValue(newVal)}
                    renderInput={(params) => <TextField {...params} label={label || i18next.t('createChildTemplateDialog.selectUserDialog.selectUser')} />}
                />
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', mb: 2 }}>
                <Button variant="contained" color="primary" disabled={!value} onClick={() => onSubmit(value!)}>
                    {i18next.t('createChildTemplateDialog.selectUserDialog.addAction')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SelectUserFieldDialog;
