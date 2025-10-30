import React from 'react';

interface IVideoPreview {
    data: string;
}

export const VideoPreview: React.FC<IVideoPreview> = ({ data }) => {
    return (
        <div>
            <video
                controls
                style={{
                    position: 'relative',
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    backgroundSize: 'cover',
                    overflow: 'hidden',
                }}
            >
                <source src={data} />
            </video>
        </div>
    );
};
