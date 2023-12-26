import { useEffect } from 'react';

export const useDynamicStyleSheet = (styleSheet: string): void => {
    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = styleSheet;

        document.head.append(styleElement);

        return () => styleElement.remove();
    }, [styleSheet]);
};
