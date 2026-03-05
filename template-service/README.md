# Template Service

## Overview

The Template Service is a NestJS-based microservice responsible for managing entity templates, relationship templates, categories, child templates, printing templates, rules, and configurations. It has been migrated from Express to NestJS with Zod validation and comprehensive Swagger documentation.

## Architecture

### Technology Stack

- **Framework**: NestJS
- **Database**: MongoDB (with Mongoose ODM)
- **Message Queue**: RabbitMQ (menashmq)
- **Validation**: Zod schemas with nestjs-zod
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **APM**: Elastic APM

### Services Integration

The Template Service communicates with:

1. **Global Search Service**: Publishes template updates to `search-queue` for indexing
2. **Kartoffel Service**: Fetches entity data (configured via `KARTOFFEL_BASE_URL`)
3. **MongoDB**: Stores all template and configuration data
4. **RabbitMQ**: Async messaging for search index updates

### Databases & Collections

**MongoDB Collections:**
- `entity-templates`: Entity template definitions
- `relationship-templates`: Relationship templates between entities
- `child-templates`: Child entity templates
- `printing-templates`: Document/printing templates
- `rules`: Business rule definitions
- `categories`: Template categories for organization
- `configs`: Service configuration (e.g., category order)

## Project Structure

```
template-service/
├── src/
│   ├── app.module.ts              # Root application module
│   ├── index.ts                   # Bootstrap and main entry
│   ├── config/                    # Configuration
│   │   ├── dotenv.ts              # Environment loader
│   │   └── index.ts               # Centralized config
│   ├── nest/                      # NestJS modules
│   │   ├── category/              # Category module (✅ COMPLETED)
│   │   │   ├── category.module.ts
│   │   │   ├── controllers/
│   │   │   │   ├── category.controller.ts
│   │   │   │   └── category.swagger.ts
│   │   │   ├── services/
│   │   │   │   ├── category.service.ts
│   │   │   │   └── category.service.spec.ts
│   │   │   ├── dto/
│   │   │   │   └── category.dto.ts
│   │   │   └── schemas/
│   │   │       └── category.schema.ts
│   │   ├── config/                # Config module (✅ COMPLETED)
│   │   ├── entityTemplate/        # TODO
│   │   ├── relationshipTemplate/  # TODO
│   │   ├── childTemplate/         # TODO
│   │   ├── printingTemplate/      # TODO
│   │   ├── rule/                  # TODO
│   │   └── health/                # Health check module (✅ COMPLETED)
│   ├── express/                   # OLD Express code (to be migrated)
│   ├── externalServices/          # External service clients
│   └── utils/                     # Utility functions
├── test/                          # E2E tests
├── jest.config.js                 # Jest configuration
├── nest-cli.json                  # NestJS CLI configuration
├── package.json
└── tsconfig.json
```

## Module Architecture Pattern

Each module follows this structure:

```
module-name/
├── module-name.module.ts          # Module definition
├── controllers/
│   ├── module-name.controller.ts  # HTTP routes
│   └── module-name.swagger.ts     # Swagger decorators
├── services/
│   ├── module-name.service.ts     # Business logic
│   └── module-name.service.spec.ts # Unit tests
├── dto/
│   └── module-name.dto.ts         # Zod DTOs for validation
├── schemas/
│   └── module-name.schema.ts      # Mongoose schemas
└── messaging/                      # (Optional) RabbitMQ consumers
    └── module-name.consumer.ts
```

## Migration Guide

### Migrating a Module from Express to NestJS

Follow these steps for each remaining module:

#### 1. Create Mongoose Schema

**Example: `src/nest/entityTemplate/schemas/entityTemplate.schema.ts`**

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type EntityTemplateDocument = HydratedDocument<EntityTemplate>;

@Schema({ timestamps: true, versionKey: false })
export class EntityTemplate {
    @ApiProperty({ example: 'person' })
    @Prop({ required: true, unique: true })
    name: string;

    @ApiProperty({ example: 'Person' })
    @Prop({ required: true, unique: true })
    displayName: string;

    // ... other properties
}

export const EntityTemplateSchema = SchemaFactory.createForClass(EntityTemplate);

// Add indexes
EntityTemplateSchema.index({ displayName: 'text' });
```

**Reference:** 
- Old: `src/express/entityTemplate/model.ts`
- New: `src/nest/entityTemplate/schemas/entityTemplate.schema.ts`

#### 2. Create Zod DTOs

**Example: `src/nest/entityTemplate/dto/entityTemplate.dto.ts`**

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateEntityTemplateSchema = z.object({
    name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
    displayName: z.string().min(1),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/),
    properties: z.object({}).passthrough(),
    propertiesOrder: z.array(z.string()),
    // ... other fields
});

export class CreateEntityTemplateDto extends createZodDto(CreateEntityTemplateSchema) {}

export class UpdateEntityTemplateDto extends createZodDto(
    CreateEntityTemplateSchema.partial()
) {}
```

**Reference:**
- Old Joi: `src/express/entityTemplate/validator.schema.ts`
- New Zod: `src/nest/entityTemplate/dto/entityTemplate.dto.ts`

#### 3. Create Service

**Example: `src/nest/entityTemplate/services/entityTemplate.service.ts`**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClsService, DefaultMongoService, MongoModelFactory } from '@packages/utils';
import { Connection } from 'mongoose';
import config from '../../../config';
import { CreateEntityTemplateDto } from '../dto/entityTemplate.dto';
import { EntityTemplate, EntityTemplateSchema } from '../schemas/entityTemplate.schema';

@Injectable()
export class EntityTemplateService extends DefaultMongoService<EntityTemplate> {
    constructor(
        @InjectConnection() connection: Connection,
        cls: ClsService,
        mongoModelFactory: MongoModelFactory,
        // Inject other services as needed
    ) {
        super(
            connection,
            cls,
            config.mongo.entityTemplatesCollectionName,
            EntityTemplateSchema,
            mongoModelFactory,
            EntityTemplate.name
        );
    }

    async createTemplate(data: CreateEntityTemplateDto) {
        // Business logic from old manager.ts
        const template = await this.model.create(data);
        return template.toObject();
    }

    // ... other methods
}
```

**Reference:**
- Old: `src/express/entityTemplate/manager.ts`
- New: `src/nest/entityTemplate/services/entityTemplate.service.ts`

#### 4. Create Controller with Swagger

**Example: `src/nest/entityTemplate/controllers/entityTemplate.controller.ts`**

```typescript
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateEntityTemplateDto } from '../dto/entityTemplate.dto';
import { EntityTemplateService } from '../services/entityTemplate.service';
import { ApiCreateTemplate, ApiGetTemplates } from './entityTemplate.swagger';

@ApiTags('Entity Templates')
@Controller('api/templates/entities')
export class EntityTemplateController {
    constructor(private readonly service: EntityTemplateService) {}

    @Post()
    @ApiCreateTemplate()
    async createTemplate(@Body() dto: CreateEntityTemplateDto) {
        return this.service.createTemplate(dto);
    }

    // ... other endpoints
}
```

**Swagger Decorators: `src/nest/entityTemplate/controllers/entityTemplate.swagger.ts`**

```typescript
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EntityTemplate } from '../schemas/entityTemplate.schema';

export const ApiCreateTemplate = () =>
    applyDecorators(
        ApiOperation({ summary: 'Create entity template' }),
        ApiResponse({ status: 201, description: 'Created', type: EntityTemplate }),
        ApiResponse({ status: 400, description: 'Bad Request' }),
    );
```

**Reference:**
- Old: `src/express/entityTemplate/router.ts` + `controller.ts`
- New: `src/nest/entityTemplate/controllers/entityTemplate.controller.ts`

#### 5. Create Module

**Example: `src/nest/entityTemplate/entityTemplate.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { MongoModelFactory } from '@packages/utils';
import { EntityTemplateController } from './controllers/entityTemplate.controller';
import { EntityTemplateService } from './services/entityTemplate.service';
import { CategoryModule } from '../category/category.module';
import { RelationshipTemplateModule } from '../relationshipTemplate/relationshipTemplate.module';

@Module({
    imports: [CategoryModule, RelationshipTemplateModule],
    controllers: [EntityTemplateController],
    providers: [EntityTemplateService, MongoModelFactory],
    exports: [EntityTemplateService],
})
export class EntityTemplateModule {}
```

#### 6. Create Unit Tests

**Example: `src/nest/entityTemplate/services/entityTemplate.service.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { EntityTemplateService } from './entityTemplate.service';
// ... imports

describe('EntityTemplateService', () => {
    let service: EntityTemplateService;
    let mockModel: Partial<Model<any>>;

    beforeEach(async () => {
        mockModel = {
            find: jest.fn().mockReturnThis(),
            create: jest.fn(),
            // ... mock methods
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EntityTemplateService,
                { provide: getConnectionToken(), useValue: mockConnection },
                // ... other providers
            ],
        }).compile();

        service = module.get<EntityTemplateService>(EntityTemplateService);
    });

    it('should create a template', async () => {
        // Test implementation
    });
});
```

**Reference:** See `src/nest/category/services/category.service.spec.ts`

#### 7. Update app.module.ts

Add the new module to imports:

```typescript
import { EntityTemplateModule } from './nest/entityTemplate/entityTemplate.module';

@Module({
    imports: [
        // ... existing modules
        EntityTemplateModule,
    ],
})
export class AppModule {}
```

## Remaining Modules to Migrate

### Priority Order:

1. **EntityTemplate** - Core module, most complex
   - Has relationships with RelationshipTemplate, Category, ChildTemplate
   - Old: `src/express/entityTemplate/`
   - Complex validation logic in `validator.template.ts`
   - Dynamic property generation

2. **RelationshipTemplate** - Depends on EntityTemplate
   - Old: `src/express/relationshipTemplate/`
   - Bidirectional relationships

3. **ChildTemplate** - Depends on EntityTemplate
   - Old: `src/express/childTemplate/`

4. **PrintingTemplate** - Relatively independent
   - Old: `src/express/printingTemplate/`

5. **Rule** - Complex validation
   - Old: `src/express/rule/`
   - Custom validation logic in `validator.ts`

## Environment Variables

```bash
# Server
PORT=3000
MAX_REQUEST_BYTE_SIZE=52428800 # 50MB

# MongoDB
MONGO_URL=mongodb://localhost:27017/template-service
MONGO_ENTITY_TEMPLATES_COLLECTION_NAME=entity-templates
MONGO_RELATIONSHIP_TEMPLATES_COLLECTION_NAME=relationship-templates
MONGO_CHILD_TEMPLATES_COLLECTION_NAME=child-templates
MONGO_PRINTING_TEMPLATES_COLLECTION_NAME=printing-templates
MONGO_RULES_COLLECTION_NAME=rules
MONGO_CATEGORIES_COLLECTION_NAME=categories
MONGO_CONFIGS_COLLECTION_NAME=configs

# RabbitMQ
RABBIT_URL=amqp://localhost:5672
UPDATE_SEARCH_INDEX_QUEUE_NAME=search-queue

# Swagger
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
SWAGGER_TITLE=Template Service API

# Kartoffel Integration
KARTOFFEL_BASE_URL=http://kartoffel-service:8080
KARTOFFEL_BASE_ENTITIES_ROUTE=/api/entities

# Logging
LOG_SERVICE_NAME=template-service
LOG_ENVIRONMENT=dev
ENABLE_CONSOLE_LOGGING=true
```

## Running the Service

### Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev:nodemon

# Build
pnpm build

# Start production
pnpm start
```

### Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e
```

### Docker

```bash
# Build
docker build -t template-service .

# Run
docker run -p 3000:3000 template-service
```

## API Documentation

When the service is running, access Swagger UI at:
```
http://localhost:3000/docs
```

## Complex Functionality

### 1. Entity Template Property Management

Entity templates support complex property types:
- **relationshipReference**: Links to other entity templates
- **fileId**: File attachments
- **location**: Geographic data
- **enum**: Predefined value lists with colors
- **textArea**: Long-form text

Properties can be converted to relationship fields dynamically.

### 2. Category Template Ordering

Categories maintain an ordered list of templates. When moving templates between categories:
1. Template is removed from source category's `templatesOrder`
2. Template is inserted into destination category at specified index
3. Both operations are atomic via MongoDB transactions

### 3. Dynamic Interface Generation

The service can generate TypeScript interfaces dynamically based on entity template definitions (see `src/utils/entityTemplateActions/interfacesGenerator.ts`).

### 4. Rule Validation

Rules support complex validation logic with custom TypeScript code execution. The service:
- Validates rule code syntax
- Compiles TypeScript to JavaScript  
- Executes rules in isolated context

### 5. Global Search Integration

Template changes are published to RabbitMQ (`search-queue`) for indexing by the Global Search Service:
- Template creation → Index new template
- Template update → Reindex
- Template deletion → Remove from index

## Testing Strategy

### Unit Tests
- Service layer: Mock mongoose models
- Controller layer: Mock services
- Utilities: Test pure functions

### Integration Tests
- Use in-memory MongoDB for tests
- Test RabbitMQ message publishing

### E2E Tests
- Full request/response cycle
- Database state validation

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failures**
   - Check `MONGO_URL` environment variable
   - Ensure MongoDB is running
   - Verify network connectivity

2. **RabbitMQ Connection Issues**
   - Verify `RABBIT_URL`
   - Check RabbitMQ service status
   - Review retry configuration

3. **Validation Errors**
   - Check Zod schema definitions
   - Review API request payloads in Swagger
   - Enable debug logging

## Migration Checklist

For each module:

- [ ] Create Mongoose schema with decorators
- [ ] Create Zod DTOs (Create, Update, Query)
- [ ] Implement service with business logic
- [ ] Create controller with routes
- [ ] Add Swagger documentation
- [ ] Write unit tests (service + controller)
- [ ] Create module and export service
- [ ] Import module in app.module.ts
- [ ] Test endpoints via Swagger UI
- [ ] Verify integration with other modules
- [ ] Remove old Express code

## Contributing

When adding new features:

1. Follow the module pattern described above
2. Add Swagger documentation for all endpoints
3. Write unit tests (minimum 80% coverage)
4. Update this README if adding new functionality
5. Use Zod for all validation

## Performance Considerations

- **Connection Pooling**: MongoDB uses connection pooling (configured in MongoModule)
- **Indexing**: All schemas have appropriate indexes for common queries
- **Throttling**: Rate limiting configured via ThrottlerModule
- **APM**: Elastic APM tracks performance metrics

## Security

- **Input Validation**: All inputs validated via Zod
- **Helmet**: Security headers via helmet middleware
- **CORS**: Configured for cross-origin requests
- **JWT**: Bearer token authentication (configure as needed)

## License

ISC
