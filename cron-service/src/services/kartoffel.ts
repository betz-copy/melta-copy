import axios from 'axios';
import config from '../config';
import { IKartoffelUser } from '@packages/user';

const { url, baseEntitiesRoute, requestTimeout, getByIdRoute } = config.kartoffel;

class Kartoffel {
    private static kartoffel = axios.create({
        baseURL: `${url}${baseEntitiesRoute}`,
        timeout: requestTimeout,
        params: { expanded: true },
    });

    static getUserById = async (id: string) => {
        const { data } = await this.kartoffel.get<IKartoffelUser>(`${getByIdRoute}/${id}`);

        return data;
    };
}

export default Kartoffel;
