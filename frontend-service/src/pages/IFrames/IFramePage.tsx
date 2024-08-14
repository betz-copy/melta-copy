import React from 'react';
import Iframe from 'react-iframe';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { CircularProgress, Grid } from '@mui/material';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { getIFrameById } from '../../services/iFramesService';
import IFrameHeadline from './Headline';

interface IFramePageProps {
    iFrame?: IMongoIFrame;
    isIFramePage?: boolean;
}

const IFramePage: React.FC<IFramePageProps> = ({ iFrame, isIFramePage = true }) => {
    const { iFrameId } = useParams();
    const id = iFrame?._id || iFrameId;
    const navigate = useNavigate();
    const { data: iFrameData, isLoading } = useQuery(['getIFrame', id], async () => getIFrameById(id!), {
        initialData: iFrame,
        retry: false,
        onError: (err) => {
            console.log(err);
            if (iFrameId) navigate('/404');
        },
    });

    if (isLoading) {
        return (
            <Grid container justifyContent="center">
                <CircularProgress />
            </Grid>
        );
    }

    return isIFramePage ? (
        <Grid
            dir="rtl"
            style={{
                position: 'absolute',
                left: 0,
                right: 70,
                bottom: -3,
                top: -4,
            }}
        >
            <Grid
                item
                style={{
                    height: '100%',
                    width: '100%',
                }}
            >
                <Iframe url={iFrameData!.url} title={iFrameData!.name} width="100%" height="100%" />
            </Grid>
        </Grid>
    ) : (
        <>
            <IFrameHeadline iFrame={iFrameData!} />
            <Iframe url={iFrameData!.url} title={iFrameData!.name} width="100%" height="100%" frameBorder={1} />
        </>
    );
};
export default IFramePage;
