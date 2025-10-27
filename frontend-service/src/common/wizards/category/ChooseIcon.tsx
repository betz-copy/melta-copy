import React from 'react';
import { ImagePicker } from '../../inputs/ImagePicker';
import { StepComponentProps } from '../index';
import { CategoryWizardValues } from './index';

const ChooseIcon: React.FC<StepComponentProps<CategoryWizardValues>> = ({ values, setFieldValue }) => (
    <ImagePicker
        image={values.icon}
        onPick={(image) => setFieldValue('icon', image)}
        onDelete={() => setFieldValue('icon', undefined)}
        defaultInputType={values.icon?.file ? 'chooseFile' : 'chooseFromOptions'}
    />
);
export { ChooseIcon };
