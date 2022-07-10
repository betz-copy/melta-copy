import React, { CSSProperties, useState } from 'react';
import { Button, Typography } from '@mui/material';
import { TwitterPicker } from 'react-color';

const ColorPicker: React.FC<{
    colors: string[];
    color: string;
    setColor: React.Dispatch<React.SetStateAction<string>>;
    text: string;
    width: CSSProperties['width'];
    height: CSSProperties['height'];
}> = ({ colors, color, setColor, text, width, height }) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button
                onClick={(_ev) =>
                    setOpen((curr) => {
                        return !curr;
                    })
                }
                style={{ backgroundColor: color, height, width, border: '1px solid rgb(196, 196, 196)' }}
            >
                <Typography style={{ color: 'black' }}>{text}</Typography>
            </Button>
            {open && (
                <TwitterPicker
                    colors={colors}
                    color={color}
                    onChange={(col) => {
                        setColor(col.hex);
                        setOpen(false);
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
                            card: { marginTop: '3px', width },
                        },
                    }}
                />
            )}
        </>
    );
};

export default ColorPicker;
