import React from 'react';
import { useTheme } from '@mui/material';

export const RelationshipIcon: React.FC<{
    color?: string;
}> = ({ color }) => {
    const theme = useTheme();
    const strokeColor = color || theme.palette.primary.main;

    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M13.6229 10.8617C13.0436 9.8588 12.0897 9.12704 10.971 8.82729C9.85234 8.52754 8.6604 8.68434 7.6573 9.2632L3.87432 11.4465C2.8711 12.0257 2.13907 12.9797 1.83925 14.0986C1.53943 15.2176 1.69639 16.4098 2.27559 17.413C2.8548 18.4162 3.80881 19.1483 4.92775 19.4481C6.04669 19.7479 7.2389 19.5909 8.24212 19.0117L10.1331 17.92"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10.0859 13.1386C10.6652 14.1415 11.619 14.8732 12.7377 15.173C13.8564 15.4728 15.0483 15.316 16.0514 14.7371L19.8344 12.5538C20.8376 11.9746 21.5697 11.0206 21.8695 9.90165C22.1693 8.78271 22.0123 7.59049 21.4331 6.58728C20.8539 5.58406 19.8999 4.85203 18.781 4.55221C17.662 4.25239 16.4698 4.40935 15.4666 4.98855L13.5756 6.08033"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
