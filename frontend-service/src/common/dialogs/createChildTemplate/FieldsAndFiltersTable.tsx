import { Button, Checkbox, FormControlLabel, Grid } from '@mui/material';
import React from 'react';
import { AddRounded } from '@mui/icons-material';
import AddFieldFilterDialog from './AddFieldFilterDialog';
import { ITemplateFieldsFilters } from '.';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

interface IFieldsAndFiltersTableProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    templateFieldsFilters: ITemplateFieldsFilters;
    setTemplateFieldsFilters: React.Dispatch<React.SetStateAction<ITemplateFieldsFilters>>;
}

const FieldsAndFiltersTable: React.FC<IFieldsAndFiltersTableProps> = ({ entityTemplate, fieldFilters, setFieldFilters }) => {
    const initFieldFilters = () => {
        entityTemplate.properties.properties.map((field) => {
            if (!fieldFilters[field.name]) {
                fieldFilters[field.name] = {
                    selected: false,
                    filters: [],
                };
            }
        });
    };

    return (
        <>
            <Grid container>
                {Object.entries(fieldFilters).map(([fieldName, fieldFilter]) => (
                    <Grid container justifyContent="space-between" key={fieldName}>
                        <Grid container alignItems="center" item xs={8} spacing={2}>
                            <Grid item xs={3}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={fieldFilter.selected}
                                            onChange={(e) => {
                                                const newFieldFilters = { ...fieldFilters };
                                                newFieldFilters[fieldName].selected = e.target.checked;
                                                setFieldFilters(newFieldFilters);
                                            }}
                                        />
                                    }
                                    label={fieldName}
                                />
                            </Grid>
                            <Grid item xs={3}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => {
                                        setAddFilterToField(fieldName);
                                    }}
                                    sx={{ width: '100%' }}
                                >
                                    <AddRounded />
                                </Button>
                            </Grid>
                        </Grid>
                        <Grid item xs={3}>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => {
                                    setAddFilterToField(fieldName);
                                }}
                                sx={{ width: '100%' }}
                            >
                                <AddRounded />
                            </Button>
                        </Grid>
                    </Grid>
                ))}
            </Grid>
            <AddFieldFilterDialog
                open={!!addFilterToField}
                onClose={() => {
                    setAddFilterToField(null);
                }}
                setFieldFilters={setFieldFilters}
                entityTemplate={entityTemplate}
                currentFieldName={addFilterToField}
                fieldFilter={fieldFilters[addFilterToField]}
            />
        </>
    );
};
export default FieldsAndFiltersTable;
