import React from 'react';
import { StepComponentProps } from '../index';
import { ImagePicker } from '../../inputs/ImagePicker';
import { EntityTemplateWizardValues } from '.';

const ChooseIcon: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, setFieldValue }) => {
    return (
        <ImagePicker
            image={values.icon}
            onPick={(image) => setFieldValue('icon', image)}
            onDelete={() => setFieldValue('icon', undefined)}
            defaultInputType={values.icon?.file ? 'chooseFile' : 'chooseFromOptions'}
        />
    );
};

export { ChooseIcon };
