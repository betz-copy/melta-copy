import { menash } from 'menashmq';
import config from '../../config';

const {
    service: { dbHeaderName },
} = config;

export default class DefaultExternalServiceRabbit {
    protected dbName: string;

    constructor(dbName: string) {
        this.dbName = dbName;
    }

    protected sendToQueue(queueName: string, content: string | Object | Buffer) {
        return menash.send(queueName, content, { headers: { [dbHeaderName]: this.dbName } });
    }
}
