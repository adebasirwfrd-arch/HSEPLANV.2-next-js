import { z } from "zod"

export const AuditActionSchema = z.enum(["INSERT", "UPDATE", "DELETE"])

export const AuditLogSchema = z.object({
    id: z.string().uuid(),
    action: AuditActionSchema,
    entity_type: z.string().min(1),
    entity_id: z.string().nullable(),
    actor_id: z.string().uuid().nullable(),
    actor_email: z.string().email().nullable(),
    description: z.string().nullable(),
    old_values: z.record(z.string(), z.any()).nullable(),
    new_values: z.record(z.string(), z.any()).nullable(),
    ip_address: z.string().nullable(),
    user_agent: z.string().nullable(),
    created_at: z.string().datetime(),
})

export type AuditLog = z.infer<typeof AuditLogSchema>
