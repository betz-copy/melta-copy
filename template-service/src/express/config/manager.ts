import mongoose from 'mongoose';
import config from '../../config';
import { NotFoundError, DefaultManagerMongo, ConfigTypes, IMongoBaseConfig, IMongoOrderConfig, IOrderConfig } from '@microservices/shared';
import { ConfigSchema, orderConfigSchema } from './model';

class ConfigManager extends DefaultManagerMongo<IMongoBaseConfig> {
    private orderDiscriminator: mongoose.Model<IMongoOrderConfig>;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.configsCollectionName, ConfigSchema);

        if (!this.model.discriminators?.[ConfigTypes.ORDER]) {
            this.orderDiscriminator = this.model.discriminator<IMongoOrderConfig>(ConfigTypes.ORDER, orderConfigSchema);
        } else {
            this.orderDiscriminator = this.model.discriminators[ConfigTypes.ORDER] as mongoose.Model<IMongoOrderConfig>;
        }
    }

    getConfigs(): Promise<IMongoBaseConfig[]> {
        return this.model.find().lean().exec();
    }

    getOrderConfigByName(name: string): Promise<IMongoOrderConfig> {
        return this.orderDiscriminator.findOne({ name }).orFail(new NotFoundError('Config not found')).lean().exec();
    }

    async updateOrder(orderId: string, newIndex: number, item: string, removeItem: boolean = false): Promise<IMongoOrderConfig> {
        const order = await this.orderDiscriminator.findById(orderId).orFail(new NotFoundError('Config order not found')).exec();

        const currentIndex: number = order.order.indexOf(item);

        if (currentIndex === -1) {
            order.order.push(item);
        } else if (removeItem) {
            order.order.splice(currentIndex, 1);
        } else {
            order.order.splice(currentIndex, 1);
            order.order.splice(newIndex, 0, item);
        }

        await order.save();

        return order;
    }

    createOrder(orderData: IOrderConfig): Promise<IMongoOrderConfig> {
        return this.orderDiscriminator.create(orderData);
    }
}

export default ConfigManager;
