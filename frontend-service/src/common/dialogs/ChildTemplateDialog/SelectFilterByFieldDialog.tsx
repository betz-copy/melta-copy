import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { FilterMode } from '.';

interface SelectUserFieldDialogProps {
    open: boolean;
    filterModeOptions: string[];
    selectedField: string | null;
    onClose: () => void;
    onSubmit: (field: string) => void;
    entityTemplate: IMongoEntityTemplatePopulated;
    title?: string;
    content?: string;
    label?: string;
    filterMode: FilterMode;
}

const SelectFilterByFieldDialog: React.FC<SelectUserFieldDialogProps> = ({
    open,
    filterModeOptions,
    selectedField,
    onClose,
    onSubmit,
    entityTemplate,
    title,
    content,
    label,
    filterMode,
}) => {
    const [value, setValue] = useState<string | null>(selectedField);

    useEffect(() => {
        setValue(selectedField);
    }, [selectedField]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ color: 'primary.main', fontSize: '16px', fontWeight: 400 }}>
                {title || i18next.t(`childTemplate.select${filterMode}Dialog.title`)}
            </DialogTitle>
            <DialogContent>
                <Typography sx={{ fontSize: '14px', mb: 2 }}>
                    {content || i18next.t(`childTemplate.select${filterMode}Dialog.description`)}
                </Typography>
                <Autocomplete
                    options={filterModeOptions}
                    getOptionLabel={(field) => entityTemplate.properties.properties[field].title}
                    value={value}
                    onChange={(_event, newVal) => setValue(newVal)}
                    renderInput={(params) => <TextField {...params} label={label || i18next.t(`childTemplate.select${filterMode}Dialog.label`)} />}
                />
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', mb: 2 }}>
                <Button variant="contained" color="primary" disabled={!value} onClick={() => onSubmit(value!)}>
                    {i18next.t('childTemplate.addAction')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SelectFilterByFieldDialog;
