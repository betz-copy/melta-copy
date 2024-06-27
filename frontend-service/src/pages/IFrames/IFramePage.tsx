import React, { useState } from 'react';
import Iframe from 'react-iframe';
import IFramesHeadline from './Headline';
import { IMongoIFrame } from '../../interfaces/iFrames';
// import { useQueryClient } from 'react-query';

interface IFramePageProps {
    iFrame?: IMongoIFrame;
}

const IFramePage: React.FC<IFramePageProps> = ({ iFrame }) => {
    return (
        <>
            <IFramesHeadline iFrame={iFrame!} />
            <Iframe
                url={iFrame!.url}
                title={iFrame!.name}
                width="100%"
                height="100%"
                styles={{
                    maxHeight: '500px',
                    overflow: 'auto',
                    borderBottomLeftRadius: 'inherit',
                    borderBottomRightRadius: 'inherit',
                }}
            />
        </>
    );
};
export default IFramePage;
