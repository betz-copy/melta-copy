import React from 'react';
import { IPropertyValue } from '../../../interfaces/entities';
import fileDetails from '../../../interfaces/fileDetails';
import { ImagePicker } from '../../inputs/ImagePicker';

export const ChooseStepsIcon: React.FC<{
    icon: fileDetails | undefined;
    index: number;
    setFieldValue: (field: string, value: IPropertyValue, shouldValidate?: boolean) => void;
}> = ({ icon, index, setFieldValue }) => (
    <ImagePicker
        image={icon}
        onPick={(image) => setFieldValue(`steps[${index}].icon`, image)}
        onDelete={() => setFieldValue(`steps[${index}].icon`, undefined)}
        defaultInputType={icon?.file ? 'chooseFile' : 'chooseFromOptions'}
    />
);
