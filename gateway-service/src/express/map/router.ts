import axios from 'axios';
import { Router } from 'express';
import config from '../../config';

const { token } = config.frontendConfig.getMapLayers;

const mapRouter: Router = Router();

mapRouter.get('/wmts-capabilities', async (req, res) => {
    const { data } = await axios.get(req.query.url as string, {
        headers: {
            'x-api-key': token,
            'Content-Type': 'application/xml',
        },
    });

    res.send(data);
});

export default mapRouter;
