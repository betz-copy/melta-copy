import { Box } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { EntityTemplateWizardValues } from '.';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';
import { StepComponentProps } from '../index';

const ExportFormats: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, errors, ...props }) => (
    <Box sx={{ width: '100%', marginBottom: '2rem' }}>
        <InstanceFileInput
            {...props}
            fileFieldName="pdfTemplatesIds"
            required={false}
            value={values.pdfTemplatesIds}
            error={errors.pdfTemplatesIds}
            fieldTemplateTitle={i18next.t('homo')}
        />
    </Box>
);

export { ExportFormats };
