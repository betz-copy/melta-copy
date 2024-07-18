import React from 'react';
import { StepComponentProps } from '../index';
import { ImagePicker } from '../../inputs/ImagePicker';
import { IFrameWizardValues } from '.';

export const ChooseIFrameIcon: React.FC<StepComponentProps<IFrameWizardValues>> = ({ values, handleChange }) => (
    <ImagePicker
        image={values.icon}
        onPick={handleChange}
        onDelete={() => handleChange({ ...values, icon: undefined })}
        defaultInputType={values.icon?.file ? 'chooseFile' : 'chooseFromOptions'}
    />
);
