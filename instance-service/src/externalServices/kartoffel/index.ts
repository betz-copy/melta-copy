import { IKartoffelUser } from '@microservices/shared';
import axios from 'axios';
import config from '../../config';

const { url, baseEntitiesRoute, searchRoute, getByIdRoute, fieldToSearch, requestTimeout, maxPageSize } = config.kartoffel;

class Kartoffel {
    private static kartoffel = axios.create({
        baseURL: `${url}${baseEntitiesRoute}`,
        timeout: requestTimeout,
        params: { expanded: true },
    });

    static searchUsers = async (queryString: string): Promise<IKartoffelUser[]> => {
        console.log({ queryString });

        const { data } = await this.kartoffel.get<IKartoffelUser[]>(searchRoute, {
            params: {
                fields: fieldToSearch,
                queryString,
            },
        });
        console.log({ data });

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

    static getUserById = async (id: string) => {
        const { data } = await this.kartoffel.get<IKartoffelUser>(`${getByIdRoute}/${id}`);
        return data;
    };
}

export default Kartoffel;
