import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClsService, DefaultMongoService, MongoModelFactory } from '@packages/utils';
import { Connection, Types } from 'mongoose';
import config from '../../../config';
import { CreateRuleDto, UpdateRuleDto } from '../dto/rule.dto';
import { Rule, RuleSchema } from '../schemas/rule.schema';

@Injectable()
export class RuleService extends DefaultMongoService<Rule> {
    constructor(@InjectConnection() connection: Connection, cls: ClsService, mongoModelFactory: MongoModelFactory) {
        super(connection, cls, config.mongo.ruleCollectionName, RuleSchema, mongoModelFactory, Rule.name);
    }

    async getAllRules(): Promise<Rule[]> {
        return this.model.find().lean<Rule[]>().exec();
    }

    async getRuleById(id: string): Promise<Rule> {
        const rule = await this.model.findById(id).lean<Rule>().exec();
        if (!rule) {
            throw new NotFoundException(`Rule with ID ${id} not found`);
        }
        return rule;
    }

    async getRulesByEntityTemplate(entityTemplateId: string): Promise<Rule[]> {
        return this.model
            .find({ entityTemplateId: new Types.ObjectId(entityTemplateId) })
            .lean<Rule[]>()
            .exec();
    }

    async createRule(data: CreateRuleDto): Promise<Rule> {
        const rule = await this.model.create(data);
        return rule.toObject() as Rule;
    }

    async updateRule(id: string, data: UpdateRuleDto): Promise<Rule> {
        const rule = await this.model.findByIdAndUpdate(id, data, { new: true }).lean<Rule>().exec();

        if (!rule) {
            throw new NotFoundException(`Rule with ID ${id} not found`);
        }
        return rule;
    }

    async deleteRule(id: string): Promise<Rule> {
        const rule = await this.model.findByIdAndDelete(id).lean<Rule>().exec();
        if (!rule) {
            throw new NotFoundException(`Rule with ID ${id} not found`);
        }
        return rule;
    }
}
