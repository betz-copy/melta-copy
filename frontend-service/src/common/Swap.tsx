import { Fade } from '@mui/material';
import React, { ReactElement, useEffect, useState } from 'react';

interface ISwapProps {
    condition?: boolean;
    isTrue?: ReactElement;
    isFalse?: ReactElement;
    animationTime?: number;
}

export const Swap: React.FC<ISwapProps> = ({ condition, isTrue = <div />, isFalse = <div />, animationTime = 500 }) => {
    const [show, setShow] = useState(condition);

    useEffect(() => {
        setTimeout(() => setShow(condition), animationTime);
    }, [condition]);

    if (show)
        return (
            <Fade in={condition} timeout={animationTime} appear={false}>
                {isTrue}
            </Fade>
        );

    return (
        <Fade in={!condition} timeout={animationTime} appear={false}>
            {isFalse}
        </Fade>
    );
};
