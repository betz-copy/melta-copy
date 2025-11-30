import { WidgetProps } from '@rjsf/utils';
import UnitSelect from '../../UnitTreeSelect';

const RjsfUnitSelectWidget = ({
    id,
    label,
    required,
    disabled,
    readonly,
    value,
    multiple,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    rawErrors = [],
    options,
    placeholder,
}: WidgetProps) => {
    return (
        <UnitSelect
            value={value}
            onChange={(val) => onChange(val)}
            label={label}
            disabled={disabled || readonly}
            multiple={multiple}
            autofocus={autofocus}
            placeholder={placeholder || options?.placeholder}
            error={rawErrors.length > 0}
            textFieldProps={{
                id,
                onBlur: (e: React.FocusEvent<HTMLInputElement>) => onBlur(id, e.target.value),
                onFocus: (e: React.FocusEvent<HTMLInputElement>) => onFocus(id, e.target.value),
                required,
            }}
            required={required}
        />
    );
};

export default RjsfUnitSelectWidget;
