
import React from 'react';
import { ImagePicker } from '../../inputs/ImagePicker';
import fileDetails from '../../../interfaces/fileDetails';

export const ChooseStepsIcon: React.FC<{
    icon: fileDetails | undefined;
    index: number;
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
}> = ({ icon, index, setFieldValue }) => (
    <ImagePicker
        image={icon}
        onPick={(image) => setFieldValue(`steps[${index}].icon`, image)}
        onDelete={() => setFieldValue(`steps[${index}].icon`, undefined)}
        defaultInputType={icon?.file ? 'chooseFile' : 'chooseFromOptions'}
    />
);