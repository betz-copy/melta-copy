import React from 'react';
import { WorkspaceWizardValues } from './index';
import { StepComponentProps } from '../../../common/wizards/index';
import { ImagePicker } from '../../../common/inputs/ImagePicker';

export const ChooseIcons: React.FC<StepComponentProps<WorkspaceWizardValues>> = ({ values, setFieldValue }) => (
    <ImagePicker
        image={values.icon}
        onPick={(image) => setFieldValue('icon', image)}
        onDelete={() => setFieldValue('icon', undefined)}
        defaultInputType={values.icon?.file ? 'chooseFile' : 'chooseFromOptions'}
    />
);
