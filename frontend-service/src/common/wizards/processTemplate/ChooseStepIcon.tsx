import { FileDetails } from '@packages/common';
import { IPropertyValue } from '@packages/entity';
import React from 'react';
import { InputPickerType } from '../../../interfaces/inputs';
import { ImagePicker } from '../../inputs/ImagePicker';

export const ChooseStepsIcon: React.FC<{
    icon: FileDetails | undefined;
    index: number;
    setFieldValue: (field: string, value: IPropertyValue, shouldValidate?: boolean) => void;
}> = ({ icon, index, setFieldValue }) => (
    <ImagePicker
        image={icon}
        onPick={(image) => setFieldValue(`steps[${index}].icon`, image)}
        onDelete={() => setFieldValue(`steps[${index}].icon`, undefined)}
        defaultInputType={icon?.file ? InputPickerType.ChooseFile : InputPickerType.ChooseFromOptions}
    />
);
