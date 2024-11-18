import React from 'react';
import { CategoryWizardValues } from './index';
import { StepComponentProps } from '../index';
import { ImagePicker } from '../../inputs/ImagePicker';

const ChooseIcon: React.FC<StepComponentProps<CategoryWizardValues>> = ({ values, setFieldValue }) => (
    <ImagePicker
        image={values.icon}
        onPick={(image) => setFieldValue('icon', image)}
        onDelete={() => setFieldValue('icon', undefined)}
        defaultInputType={values.icon?.file ? 'chooseFile' : 'chooseFromOptions'}
    />
);
export { ChooseIcon };
