import mongoose from 'mongoose';
import config from '../../config';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { NotFoundError } from '../error';
import { ConfigTypes, IMongoBaseConfig, IMongoOrderConfig, IOrderConfig } from './interface';
import { ConfigSchema, orderConfigSchema } from './model';

class ConfigManager extends DefaultManagerMongo<IMongoBaseConfig> {
    private orderDiscriminator: mongoose.Model<IMongoOrderConfig>;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.configCollectionName, ConfigSchema);

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
        return this.orderDiscriminator.findOne({ name: name }).orFail(new NotFoundError('Config not found')).lean().exec();
    }

    updateOrder(id: string, updatedOrder: Partial<IOrderConfig>): Promise<IMongoOrderConfig> {
        return this.orderDiscriminator
            .findByIdAndUpdate(id, { ...updatedOrder }, { new: true })
            .orFail(new NotFoundError('Config Order not found'))
            .lean()
            .exec();
    }

    createOrder(orderData: IOrderConfig): Promise<IMongoOrderConfig> {
        return this.orderDiscriminator.create(orderData);
    }
}

export default ConfigManager;
