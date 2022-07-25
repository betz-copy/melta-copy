import { useContext } from 'react';
import { MuiComponentContext } from '@rjsf/material-ui';

export function useMuiComponent() {
    const muiComponents = useContext(MuiComponentContext);

    if (!muiComponents) {
        throw new Error('Either v4 or v5 of material-ui components and icons must be installed as dependencies');
    }

    return muiComponents;
}
