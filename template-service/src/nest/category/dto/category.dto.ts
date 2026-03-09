import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Base Category Schema
export const CategorySchema = z.object({
    name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must start with letter or underscore, followed by letters, numbers, or underscores'),
    displayName: z.string().min(1),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
    iconFileId: z.string().nullable().optional(),
    templatesOrder: z.array(z.string()).optional().default([]),
});

// Create Category DTO
export class CreateCategoryDto extends createZodDto(CategorySchema.pick({ name: true, displayName: true, color: true, iconFileId: true })) {}

// Update Category DTO - includes templatesOrder for reordering
export class UpdateCategoryDto extends createZodDto(CategorySchema.partial()) {}

// Query DTO for getting categories
export const GetCategoriesQuerySchema = z.object({
    search: z.string().optional(),
});

export class GetCategoriesQueryDto extends createZodDto(GetCategoriesQuerySchema) {}

// DTO for updating template order
export const UpdateTemplatesOrderSchema = z.object({
    newCategoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId'),
    srcCategoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId'),
    newIndex: z.number().int().min(0),
});

export class UpdateTemplatesOrderDto extends createZodDto(UpdateTemplatesOrderSchema) {}
