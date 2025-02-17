import React from 'react';
import { MeltaCheckbox } from '../MeltaCheckbox';
import PermissionViewIcon from './PermissionViewIcon';

const PermissionScopeBtn: React.FC<{
    viewMode: boolean;
    defaultChecked: boolean;
    disabled: boolean;
    onChange;
    indeterminate?: boolean;
    checkboxSx?;
}> = ({ viewMode, defaultChecked, disabled, indeterminate, onChange, checkboxSx }) => {
    if (viewMode) return <PermissionViewIcon checked={defaultChecked} indeterminate={indeterminate} />;
    return <MeltaCheckbox checked={defaultChecked} onChange={onChange} disabled={disabled} checkboxSx={checkboxSx} indeterminate={indeterminate} />;
};

export default PermissionScopeBtn;
