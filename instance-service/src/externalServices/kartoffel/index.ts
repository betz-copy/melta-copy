import { IKartoffelUser } from '@microservices/shared';
import axios from 'axios';
import config from '../../config';

const { url, baseEntitiesRoute, searchRoute, fieldToSearch, requestTimeout, maxPageSize } = config.kartoffel;

class Kartoffel {
    private static kartoffel = axios.create({
        baseURL: `${url}${baseEntitiesRoute}`,
        timeout: requestTimeout,
        params: { expanded: true },
    });

    static searchUsers = async (queryString: string): Promise<IKartoffelUser[]> => {
        const { data } = await this.kartoffel.get<IKartoffelUser[]>(searchRoute, {
            params: {
                fields: fieldToSearch,
                queryString,
            },
        });

        return data;
    };

    static getUsersByIds = async (ids: string[]) => {
        const { data } = await this.kartoffel.get<IKartoffelUser[]>(``, {
            params: {
                ids: ids,
                page: 1,
                pageSize: maxPageSize,
            },
        });
        return data;
    };
}

export default Kartoffel;
