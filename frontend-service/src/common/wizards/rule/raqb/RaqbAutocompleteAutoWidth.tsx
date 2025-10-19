import React, { useEffect, useRef, useState } from 'react';
import { MuiWidgets, FieldProps } from '@react-awesome-query-builder/mui';

const { MuiFieldAutocomplete } = MuiWidgets;

export const RaqbMuiAutocompeleteAutoWidth: React.FC<FieldProps> = (fieldProps) => {
    const [inputWidth, setInputWidth] = useState<number>(170);
    const { setField, selectedLabel } = fieldProps;
    const autocompleteRef = useRef<HTMLDivElement | undefined>(undefined);

    useEffect(() => {
        const inputElement = autocompleteRef.current!.firstChild!.firstChild!.firstChild as HTMLInputElement;

        if (inputWidth < inputElement.scrollWidth) {
            setInputWidth(inputElement.scrollWidth);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLabel]);

    return (
        <MuiFieldAutocomplete
            {...fieldProps}
            setField={(field) => {
                const DEFAULT_INPUT_WIDTH = 170;
                setInputWidth(DEFAULT_INPUT_WIDTH);

                setField(field);
            }}
            customProps={{
                style: {}, // override width of raqb. affected by config.settings.defaultSearchWidth. see https://github.com/ukrbublik/react-awesome-query-builder/blob/master/CONFIG.adoc#configsettings
                sx: { '& .MuiAutocomplete-input': { minWidth: `${inputWidth}px !important` } },
                ref: autocompleteRef,
                slotProps: { popper: { dir: 'ltr', style: { width: 'fit-content' } } },
            }}
        />
    );
};
