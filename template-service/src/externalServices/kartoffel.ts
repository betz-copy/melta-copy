import { IKartoffelUser } from '@packages/user';
import axios from 'axios';
import config from '../config';

const { url, baseEntitiesRoute, requestTimeout, maxPageSize } = config.kartoffel;

class Kartoffel {
    private static kartoffel = axios.create({
        baseURL: `${url}${baseEntitiesRoute}`,
        timeout: requestTimeout,
        params: { expanded: true },
    });

    static getUsersByIds = async (ids: string[]) => {
        if (!ids.length) return [];

        try {
            const { data } = await this.kartoffel.get<IKartoffelUser[]>(``, {
                params: {
                    ids: ids,
                    page: 1,
                    pageSize: maxPageSize,
                },
            });
            return data;
        } catch {
            return [];
        }
    };
}

export default Kartoffel;
