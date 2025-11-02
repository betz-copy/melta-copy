import React from 'react';
import { ImagePicker } from '../../inputs/ImagePicker';
import { StepComponentProps } from '../index';
import { EntityTemplateWizardValues } from '.';

export const ChooseIcon: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, setFieldValue }) => (
    <ImagePicker
        image={values.icon}
        onPick={(image) => setFieldValue('icon', image)}
        onDelete={() => setFieldValue('icon', undefined)}
        defaultInputType={values.icon?.file ? 'chooseFile' : 'chooseFromOptions'}
    />
);
