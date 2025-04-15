import axios from '../../axios';
import { environment } from '../../globals';
import { ConfigTypes, IMongoOrderConfig, IOrderConfig } from '../../interfaces/config';

const { templatesConfig } = environment.api;

const updateConfigOrderRequest = async (configId: string, configData: Partial<IOrderConfig>): Promise<IMongoOrderConfig> => {
    const { data } = await axios.put(`${templatesConfig}/${ConfigTypes.ORDER}/${configId}`, configData);

    return data;
};

const getOrderConfigByNameRequest = async (name: string): Promise<IMongoOrderConfig> => {
    const { data } = await axios.get(`${templatesConfig}/${ConfigTypes.ORDER}/${name}`);

    return data;
};

export { updateConfigOrderRequest, getOrderConfigByNameRequest };
