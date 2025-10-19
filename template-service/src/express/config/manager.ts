import mongoose from 'mongoose';
import {
    NotFoundError,
    DefaultManagerMongo,
    ConfigTypes,
    IMongoBaseConfig,
    IMongoCategoryOrderConfig,
    ICategoryOrderConfig,
} from '@microservices/shared';
import config from '../../config';
import { ConfigSchema, orderConfigSchema } from './model';

class ConfigManager extends DefaultManagerMongo<IMongoBaseConfig> {
    private categoryOrderDiscriminator: mongoose.Model<IMongoCategoryOrderConfig>;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.configsCollectionName, ConfigSchema);

        if (!this.model.discriminators?.[ConfigTypes.CATEGORY_ORDER]) {
            this.categoryOrderDiscriminator = this.model.discriminator<IMongoCategoryOrderConfig>(ConfigTypes.CATEGORY_ORDER, orderConfigSchema);
        } else {
            this.categoryOrderDiscriminator = this.model.discriminators[ConfigTypes.CATEGORY_ORDER] as mongoose.Model<IMongoCategoryOrderConfig>;
        }
    }

    getConfigs(): Promise<IMongoBaseConfig[]> {
        return this.model.find().lean().exec();
    }

    getConfigByType(type: ConfigTypes): Promise<IMongoBaseConfig> {
        return this.model.findOne({ type }).orFail(new NotFoundError('Config not found')).lean().exec();
    }

    async updateCategoryOrder(orderId: string, newIndex: number, item: string, removeItem: boolean = false): Promise<IMongoCategoryOrderConfig> {
        const order = await this.categoryOrderDiscriminator.findById(orderId).orFail(new NotFoundError('Config order not found')).exec();
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

    createCategoryOrder(orderData: ICategoryOrderConfig): Promise<IMongoCategoryOrderConfig> {
        return this.categoryOrderDiscriminator.create(orderData);
    }
}

export default ConfigManager;
