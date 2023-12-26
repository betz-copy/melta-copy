import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import React from 'react';
import { ConjsProps } from 'react-awesome-query-builder';

// taken from https://github.com/ukrbublik/react-awesome-query-builder/blob/master/modules/components/widgets/vanilla/core/VanillaConjs.jsx
export default ({ id, not, setNot, conjunctionOptions, setConjunction, disabled, readonly, showNot, notLabel }: ConjsProps) => {
    if (!conjunctionOptions) throw new Error('conjunctionOptions is undefined');

    const conjsCount = Object.keys(conjunctionOptions).length;
    const showConj = conjsCount > 1 && !disabled;

    const renderOptions = () => {
        const val = Object.values(conjunctionOptions).find((option) => option.checked)!.key;

        return (
            <ToggleButtonGroup
                className="toggle-buttons"
                color="primary"
                exclusive
                onChange={(_e, x) => {
                    setConjunction(x);
                }}
                value={val}
            >
                {Object.keys(conjunctionOptions).map((key) => {
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    const { id, checked } = conjunctionOptions[key];
                    if ((readonly || disabled) && !checked) return null;

                    return (
                        <ToggleButton key={id} id={id} disabled={readonly || disabled} value={key}>
                            {key}
                        </ToggleButton>
                    );
                })}
            </ToggleButtonGroup>
        );
    };

    // not is not allowed (because of our config) so it doesnt matter
    const onNotChange = (e) => setNot(e.target.checked);
    const renderNot = () => {
        const postfix = 'not';
        return (
            <>
                <input key={id + postfix} type="checkbox" id={id + postfix} checked={not} disabled={readonly} onChange={onNotChange} />
                <label key={`${id + postfix}label`} htmlFor={id + postfix}>
                    {notLabel || 'NOT'}
                </label>
            </>
        );
    };

    return (
        <>
            {showNot && renderNot()} {showConj && renderOptions()}
        </>
    );
};
