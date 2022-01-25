import React, { useEffect } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAxios } from '../../../axios';
import { environment } from '../../../globals';
import { RelationshipTemplateWizardValues } from './index';
import { IMongoEntityTemplate } from '../../../interfaces';
import { StepComponentProps } from '../index';

const chooseTemplateSchema = (fieldName: string) => {
    return {
        [fieldName]: Yup.object({
            _id: Yup.string().required('חובה'),
            displayName: Yup.string().required('חובה'),
        }).required('חובה'),
    };
};

const ChooseTemplate: React.FC<StepComponentProps<RelationshipTemplateWizardValues> & { fieldName: 'sourceEntity' | 'destinationEntity' }> = ({
    values,
    touched,
    errors,
    setFieldValue,
    fieldName,
}) => {
    const [{ data: entityTemplates, loading: entityTemplatesLoading, error: entityTemplatesError }] = useAxios<IMongoEntityTemplate[]>(
        environment.api.entityTemplates,
    );

    useEffect(() => {
        if (entityTemplatesError) {
            toast.error('failed to get templates');
        }
    }, [entityTemplatesError]);

    return (
        <Autocomplete
            id={fieldName}
            options={entityTemplates || []}
            onChange={(e, value) => setFieldValue(fieldName, value || '')}
            loading={entityTemplatesLoading}
            value={values[fieldName]._id ? values[fieldName] : null}
            getOptionLabel={(option) => option.displayName}
            renderInput={(params) => (
                <TextField
                    {...params}
                    error={Boolean(touched[fieldName] && errors[fieldName])}
                    fullWidth
                    helperText={touched[fieldName] && errors[fieldName]?._id}
                    name={fieldName}
                    variant="outlined"
                    label={fieldName}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {entityTemplatesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );
};

export { ChooseTemplate, chooseTemplateSchema };
