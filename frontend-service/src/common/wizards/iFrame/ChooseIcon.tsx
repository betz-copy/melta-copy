import React from 'react';
import { InputPickerType } from '../../../interfaces/inputs';
import { ImagePicker } from '../../inputs/ImagePicker';
import { StepComponentProps } from '../index';
import { IFrameWizardValues } from '.';

const ChooseIFrameIcon: React.FC<StepComponentProps<IFrameWizardValues>> = ({ values, setFieldValue }) => (
    <ImagePicker
        image={values.icon}
        onPick={(image) => setFieldValue('icon', image)}
        onDelete={() => setFieldValue('icon', undefined)}
        defaultInputType={values.icon?.file ? InputPickerType.ChooseFile : InputPickerType.ChooseFromOptions}
    />
);
export { ChooseIFrameIcon };
