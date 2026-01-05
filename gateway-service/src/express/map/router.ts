import axios from 'axios';
import { Router } from 'express';
import config from '../../config';

const {
    frontendConfig: {
        getMapLayers: { token },
    },
} = config;

const mapRouter: Router = Router();

mapRouter.get('/wmts-capabilities', async (req, res) => {
    console.log('enterrrr', req.query.url);

    const { data } = await axios.get(req.query.url as string, {
        headers: {
            'x-api-key': token,
            'Content-Type': 'application/xml',
        },
    });

    console.dir({ data });
    res.send(data);
});

export default mapRouter;
