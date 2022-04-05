import React, { CSSProperties } from 'react';
import { environment } from '../globals';

const CustomIcon: React.FC<{ iconUrl: string; width: string; height: string; style?: CSSProperties }> = ({ iconUrl, width, height, style }) => {
    return <img src={`/api${environment.api.storage}/${iconUrl}`} height={height} width={width} style={style} />;
};

export { CustomIcon };
