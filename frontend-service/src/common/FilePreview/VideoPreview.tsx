import { Box } from '@mui/material';
import React, { CSSProperties, useRef, useState } from 'react';
import ReactPlayer from 'react-player';

interface IVideoPreview {
    data: string;
    maxHeight?: CSSProperties['maxHeight'];
    maxWidth?: CSSProperties['maxWidth'];
}

export const VideoPreview: React.FC<IVideoPreview> = ({ data, maxHeight, maxWidth }) => {
    const [playing, setPlaying] = useState(false);
    const playerRef = useRef<ReactPlayer>(null);

    return (
        <Box
            onMouseEnter={() => setPlaying(true)}
            onClick={() => setPlaying(!playing)}
            onMouseLeave={() => {
                playerRef.current?.seekTo(0);
                setPlaying(false);
            }}
            sx={{
                cursor: 'pointer',
                borderRadius: '1rem',
                overflow: 'hidden',
                objectFit: 'cover',
                display: 'block',
            }}
        >
            <ReactPlayer
                ref={playerRef}
                url={data}
                playing={playing}
                loop
                style={{
                    maxWidth,
                    maxHeight,
                    borderRadius: '1rem',
                    cursor: 'pointer',
                }}
            />
        </Box>
    );
};
