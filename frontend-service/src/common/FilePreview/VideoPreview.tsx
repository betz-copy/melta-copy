import React, { CSSProperties, useRef } from 'react';

interface IVideoPreview {
    data: string;
    maxHeight?: CSSProperties['maxHeight'];
    maxWidth?: CSSProperties['maxWidth'];
}

export const VideoPreview: React.FC<IVideoPreview> = ({ data, maxHeight, maxWidth }) => {
    const playerRef = useRef<HTMLVideoElement>(null);

    return (
        <div style={{ maxHeight, maxWidth }}>
            <video
                controls
                ref={playerRef}
                style={{
                    position: 'relative',
                    right: 0,
                    bottom: 0,
                    width: maxWidth,
                    height: maxHeight,
                    backgroundSize: 'cover',
                    overflow: 'hidden',
                }}
            >
                <source src={data} />
            </video>
        </div>
    );
};
