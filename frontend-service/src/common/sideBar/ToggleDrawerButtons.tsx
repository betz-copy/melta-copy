import React from 'react';
import { useDarkModeStore } from '../../stores/darkMode';

export const OpenDrawerButton: React.FC = () => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <svg
            width="18"
            height="89"
            viewBox="0 0 18 89"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: 'scale(1.75)' }}
            role="img"
            aria-label="Open sidebar"
        >
            <title>Open sidebar</title>
            <path
                d="M17 0.297112C17 0.13302 16.867 0 16.7029 0V0C16.3182 0 15.9971 0.293751 15.963 0.676955L15 11.5L14.6581 14.0905C13.9631 19.3576 11.4163 24.2055 7.47362 27.7665V27.7665C-2.21403 36.5162 -2.38376 51.6675 7.10545 60.6321L7.55365 61.0555C11.4488 64.7353 13.933 69.6626 14.5753 74.9824L15 78.5L15.9575 88.3253C15.9948 88.7081 16.3166 89 16.7011 89V89C16.8662 89 17 88.8662 17 88.7011V0.297112Z"
                fill={darkMode ? '#000' : '#1E2775'}
            />

            <path d="M11.5002 48.0833L7.9585 44.5417L11.5002 41" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export const CloseDrawerButton: React.FC = () => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <svg
            width="19"
            height="89"
            viewBox="0 0 19 89"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: 'scale(1.75)' }}
            role="img"
            aria-label="Close sidebar"
        >
            <title>Close sidebar</title>
            <path
                d="M2 0.297112C2 0.13302 2.13302 0 2.29711 0C2.68183 0 3.00288 0.293751 3.03698 0.676955L4 11.5L4.34186 14.0905C5.03692 19.3576 7.58369 24.2055 11.5264 27.7665C21.214 36.5162 21.3838 51.6675 11.8945 60.6321L11.4464 61.0555C7.55117 64.7353 5.06696 69.6626 4.42468 74.9825L4 78.5L3.04249 88.3253C3.00519 88.7081 2.68344 89 2.29886 89C2.13381 89 2 88.8662 2 88.7011V0.297112Z"
                fill={darkMode ? '#252527' : '#F2F4FA'}
            />

            <path
                d="M8.49984 48.0833L12.0415 44.5417L8.49984 41"
                stroke={darkMode ? '#fff' : '#1E2775'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
