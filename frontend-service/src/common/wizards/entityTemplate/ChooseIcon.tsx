import React from 'react';
import { StepComponentProps } from '../index';
import { ImagePicker } from '../../inputs/ImagePicker';
import { EntityTemplateWizardValues } from '.';

const ChooseIcon: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, setFieldValue }) => {
    return (
        <ImagePicker
            image={values.file}
            setImage={(image) => {
                setFieldValue('file', image);
            }}
            defaultInputType={values.file ? 'chooseFile' : 'chooseFromOptions'}
        />
    );
};

export { ChooseIcon };
