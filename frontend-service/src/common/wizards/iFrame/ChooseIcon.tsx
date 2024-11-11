import React from 'react';
import { StepComponentProps } from '../index';
import { ImagePicker } from '../../inputs/ImagePicker';
import { IFrameWizardValues } from '.';

const ChooseIFrameIcon: React.FC<StepComponentProps<IFrameWizardValues>> = ({ values, setFieldValue }) => (
    <ImagePicker
        image={values.icon}
        onPick={(image) => setFieldValue('icon', image)}
        onDelete={() => setFieldValue('icon', undefined)}
        defaultInputType={values.icon?.file ? 'chooseFile' : 'chooseFromOptions'}
    />
);
export { ChooseIFrameIcon };
