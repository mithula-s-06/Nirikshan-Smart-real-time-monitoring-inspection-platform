import { ChecklistTemplate, IChecklistTemplateDocument } from '../models/checklistTemplate.model';
import { NotFoundError, ConflictError } from '../utils/errors';
import { CreateChecklistTemplateInput } from '@nirikshan/validation';

export class ChecklistService {
  public static async createTemplate(input: CreateChecklistTemplateInput) {
    const existing = await ChecklistTemplate.findOne({ code: input.code.toUpperCase() });
    if (existing) {
      throw new ConflictError(`Checklist template with code '${input.code}' already exists.`);
    }

    const template = await ChecklistTemplate.create({
      ...input,
      code: input.code.toUpperCase(),
    });

    return template.toJSON();
  }

  public static async getTemplates(scheme?: string) {
    const filter: Record<string, any> = { isActive: true };
    if (scheme) {
      filter.scheme = new RegExp(scheme, 'i');
    }
    const templates = await ChecklistTemplate.find(filter).sort({ createdAt: -1 });
    return templates.map((t) => t.toJSON());
  }

  public static async getTemplateById(id: string) {
    const template = await ChecklistTemplate.findById(id);
    if (!template) {
      throw new NotFoundError(`Checklist template '${id}' not found.`);
    }
    return template.toJSON();
  }
}
