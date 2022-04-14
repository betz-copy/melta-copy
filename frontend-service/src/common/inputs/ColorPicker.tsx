import React, { useState } from 'react';
import { Button, Typography } from '@mui/material';
import { TwitterPicker } from 'react-color';

const ColorPicker: React.FC<{
    colors: string[];
    color: string;
    setColor: React.Dispatch<React.SetStateAction<string>>;
    text: string;
}> = ({ colors, color, setColor, text }) => {
    const [open, setopen] = useState(false);
    return (
        <>
            <Button
                onClick={(_ev) =>
                    setopen((curr) => {
                        return !curr;
                    })
                }
                style={{ backgroundColor: color, height: '50px', width: '220px', border: '1px solid rgb(196, 196, 196)' }}
            >
                <Typography style={{ color: 'black' }}>{text}</Typography>
            </Button>
            {open ? (
                <TwitterPicker
                    colors={colors}
                    color={color}
                    onChange={(col) => {
                        setColor(col.hex);
                        setopen(false);
                    }}
                    triangle="top-right"
                    styles={{
                        default: {
                            hash: {
                                display: 'none',
                            },
                            input: {
                                display: 'none',
                            },
                            card: { marginTop: '3px', width: '220px' },
                        },
                    }}
                />
            ) : (
                // eslint-disable-next-line react/jsx-no-useless-fragment
                <></>
            )}
        </>
    );
};

export default ColorPicker;
