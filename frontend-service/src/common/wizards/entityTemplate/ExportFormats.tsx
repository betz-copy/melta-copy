import { Box } from '@mui/material';
import React from 'react';
import { EntityTemplateWizardValues } from '.';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';
import { StepComponentProps } from '../index';

export const ExportFormats: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, errors, ...props }) => (
    <Box sx={{ width: '100%', marginBottom: '2rem' }}>
        <InstanceFileInput
            {...props}
            fileFieldName="pdfTemplatesIds"
            fieldTemplateTitle=""
            required={false}
            value={values.pdfTemplatesIds}
            error={errors.pdfTemplatesIds}
        />
    </Box>
);
