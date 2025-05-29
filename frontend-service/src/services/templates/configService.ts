import axios from '../../axios';
import { environment } from '../../globals';
import { ConfigTypes, IMongoBaseConfig, IMongoCategoryOrderConfig } from '../../interfaces/config';

const { templatesConfig } = environment.api;

const updateConfigCategoryOrderRequest = async (configId: string, newIndex: number, item: string): Promise<IMongoCategoryOrderConfig> => {
    const { data } = await axios.put(`${templatesConfig}/${ConfigTypes.CATEGORY_ORDER}/${configId}`, { newIndex, item });

    return data;
};

const getConfigByTypeRequest = async (type: ConfigTypes): Promise<IMongoBaseConfig> => {
    const { data } = await axios.get(`${templatesConfig}/${type}`);

    return data;
};

export { updateConfigCategoryOrderRequest, getConfigByTypeRequest };
