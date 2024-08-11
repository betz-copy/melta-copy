import { InfoOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { EntityTemplateWizardValues } from '.';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';
import { StepComponentProps } from '../index';

export const ExportFormats: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, errors, ...props }) => (
    <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', width: '80%', marginBottom: '3rem' }}>
            <InfoOutlined sx={{ marginX: '0.5rem', color: '#1E2775' }} />
            <Typography sx={{ color: 'gray' }}>{i18next.t('wizard.entityTemplate.exportDocumentsInfo')}</Typography>
        </Box>
        <Box sx={{ width: '100%', marginBottom: '2rem' }}>
            <InstanceFileInput
                {...props}
                fileFieldName="documentTemplatesIds"
                fieldTemplateTitle=""
                required={false}
                value={values.documentTemplatesIds}
                error={errors.documentTemplatesIds}
            />
        </Box>
    </Box>
);
