import React from 'react';
import { InputPickerType } from '../../../interfaces/inputs';
import { EntityTemplateWizardValues } from '../../../interfaces/template';
import { ImagePicker } from '../../inputs/ImagePicker';
import { StepComponentProps } from '../index';

export const ChooseIcon: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, setFieldValue }) => (
    <ImagePicker
        image={values.icon}
        onPick={(image) => setFieldValue('icon', image)}
        onDelete={() => setFieldValue('icon', undefined)}
        defaultInputType={values.icon?.file ? InputPickerType.ChooseFile : InputPickerType.ChooseFromOptions}
    />
);
