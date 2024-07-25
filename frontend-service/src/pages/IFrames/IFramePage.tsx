import React from 'react';
import Iframe from 'react-iframe';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Button, CircularProgress, Grid } from '@mui/material';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { getIFrameById } from '../../services/iFramesService';
import IFrameHeadline from './Headline';

interface IFramePageProps {
    iFrame?: IMongoIFrame;
    isIFramePage?: boolean;
    handleClose?: () => void;
}

const IFramePage: React.FC<IFramePageProps> = ({ iFrame, isIFramePage = true, handleClose }) => {
    const { iFrameId } = useParams();
    const id = iFrame?._id || iFrameId;
    const navigate = useNavigate();

    const { data: iFrameData, isLoading } = useQuery(['getIFrame', id], async () => getIFrameById(id!), {
        initialData: iFrame,
        retry: false,
        onError: (err) => {
            console.log(err);
            navigate('/404');
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
                left: 1,
                right: 80,
                bottom: 47,
                top: 0,
            }}
            height="100%"
        >
            <Iframe url={iFrameData!.url} title={iFrameData!.name} width="100%" height="100%" />
        </Grid>
    ) : (
        <>
            <IFrameHeadline iFrame={iFrameData!} />
            <Iframe url={iFrameData!.url} title={iFrameData!.name} width="100%" height="100%" frameBorder={1} />
            {/* <Button onClick={handleClose}>Close</Button> */}
        </>
    );
};
export default IFramePage;
