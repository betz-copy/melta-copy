import React from 'react';
import { CategoryWizardValues } from './index';
import { StepComponentProps } from '../index';
import { ColorPicker } from '../../inputs/ColorPicker';

const ChooseColor: React.FC<StepComponentProps<CategoryWizardValues>> = ({ values, setFieldValue }) => {
    return <ColorPicker color={values.color} onColorChange={(color) => setFieldValue('color', color)} deleteAndDoneIcons={false} />;
};

export { ChooseColor };
