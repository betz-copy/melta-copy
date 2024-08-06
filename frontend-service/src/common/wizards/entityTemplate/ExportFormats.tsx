import { InfoOutlined } from '@mui/icons-material';
import { Box } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { EntityTemplateWizardValues } from '.';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';
import { MeltaTooltip } from '../../MeltaTooltip';
import { StepComponentProps } from '../index';

export const ExportFormats: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, errors, ...props }) => (
    <Box sx={{ width: '100%' }}>
        <MeltaTooltip title={i18next.t('wizard.entityTemplate.exportDocumentsInfo')}>
            <InfoOutlined sx={{ color: '#1E2775', cursor: 'pointer', marginLeft: '0.5rem' }} />
        </MeltaTooltip>
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
