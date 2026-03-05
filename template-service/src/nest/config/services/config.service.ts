import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClsService, DefaultMongoService, MongoModelFactory } from '@packages/utils';
import { ConfigTypes, ICategoryOrderConfig, IMongoBaseConfig, IMongoCategoryOrderConfig } from '@packages/workspace';
import { Connection, Model } from 'mongoose';
import config from '../../../config';
import { CategoryOrderConfig, CategoryOrderConfigSchema, Config, ConfigSchema } from '../schemas/config.schema';

@Injectable()
export class ConfigService extends DefaultMongoService<Config> {
    private categoryOrderDiscriminator: Model<CategoryOrderConfig>;

    constructor(@InjectConnection() connection: Connection, cls: ClsService, mongoModelFactory: MongoModelFactory) {
        super(connection, cls, config.mongo.configsCollectionName, ConfigSchema, mongoModelFactory, Config.name);

        // Create discriminator for CategoryOrderConfig
        const existingModel = this.model.discriminators?.[ConfigTypes.CATEGORY_ORDER];
        if (existingModel) {
            this.categoryOrderDiscriminator = existingModel as Model<CategoryOrderConfig>;
        } else {
            this.categoryOrderDiscriminator = this.model.discriminator(ConfigTypes.CATEGORY_ORDER, CategoryOrderConfigSchema);
        }
    }

    async getConfigs(): Promise<IMongoBaseConfig[]> {
        return this.model.find().lean<IMongoBaseConfig[]>().exec();
    }

    async getConfigByType(type: ConfigTypes): Promise<IMongoBaseConfig> {
        const config = await this.model.findOne({ type }).lean<IMongoBaseConfig>().exec();
        if (!config) {
            throw new NotFoundException(`Config with type ${type} not found`);
        }
        return config;
    }

    async updateCategoryOrder(orderId: string, newIndex: number, item: string, removeItem: boolean = false): Promise<IMongoCategoryOrderConfig> {
        const order = await this.categoryOrderDiscriminator.findById(orderId).exec();
        if (!order) {
            throw new NotFoundException('Config order not found');
        }

        const currentIndex = order.order.indexOf(item);

        if (currentIndex === -1) {
            order.order.push(item);
        } else if (removeItem) {
            order.order.splice(currentIndex, 1);
        } else {
            order.order.splice(currentIndex, 1);
            order.order.splice(newIndex, 0, item);
        }

        await order.save();
        return order.toObject() as unknown as IMongoCategoryOrderConfig;
    }

    async createCategoryOrder(orderData: ICategoryOrderConfig): Promise<IMongoCategoryOrderConfig> {
        const order = await this.categoryOrderDiscriminator.create(orderData);
        return order.toObject() as unknown as IMongoCategoryOrderConfig;
    }
}
