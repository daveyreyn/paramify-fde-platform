import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable(),
  isSuper: z.boolean(),
});
export type User = z.infer<typeof UserSchema>;

// Note: paramifyApiKey is deliberately absent — it never leaves the server.
export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Team = z.infer<typeof TeamSchema>;

// Slug the CLI references (`fde install <name>`, `fde run <name>`).
export const DeliverableNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'must be a kebab-case slug');

export const DeliverableSchema = z.object({
  id: z.string(),
  name: DeliverableNameSchema,
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  fileName: z.string(),
  size: z.number().int(),
  sha256: z.string(),
  language: z.string().nullable(),
  version: z.number().int(),
  installCount: z.number().int(),
  isPublic: z.boolean(),
  author: UserSchema,
  teams: z.array(TeamSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Deliverable = z.infer<typeof DeliverableSchema>;

// Sent as the JSON `metadata` field of the multipart upload, next to `file`.
// title/description/tags are optional so a re-upload only overwrites the
// fields actually provided; title defaults to the name on first upload.
export const UploadDeliverableRequestSchema = z.object({
  name: DeliverableNameSchema,
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // Team names to attach; must be teams the author belongs to unless super.
  teams: z.array(z.string()).default([]),
});
export type UploadDeliverableRequest = z.input<typeof UploadDeliverableRequestSchema>;

export const ShareDeliverableRequestSchema = z.object({
  teams: z.array(z.string()).min(1),
});
export type ShareDeliverableRequest = z.infer<typeof ShareDeliverableRequestSchema>;

export const SaveDeliverableRequestSchema = z.object({
  team: z.string(),
});
export type SaveDeliverableRequest = z.infer<typeof SaveDeliverableRequestSchema>;

export const HealthResponseSchema = z.object({
  ok: z.literal(true),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const MeResponseSchema = z.object({
  user: UserSchema,
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const TeamsResponseSchema = z.object({
  teams: z.array(TeamSchema),
});
export type TeamsResponse = z.infer<typeof TeamsResponseSchema>;

export const DeliverableResponseSchema = z.object({
  deliverable: DeliverableSchema,
});
export type DeliverableResponse = z.infer<typeof DeliverableResponseSchema>;

export const DeliverablesResponseSchema = z.object({
  deliverables: z.array(DeliverableSchema),
});
export type DeliverablesResponse = z.infer<typeof DeliverablesResponseSchema>;

// One uploaded revision of a deliverable; every upload is preserved.
export const DeliverableVersionSchema = z.object({
  version: z.number().int(),
  fileName: z.string(),
  size: z.number().int(),
  sha256: z.string(),
  language: z.string().nullable(),
  createdAt: z.string(),
});
export type DeliverableVersion = z.infer<typeof DeliverableVersionSchema>;

export const VersionsResponseSchema = z.object({
  versions: z.array(DeliverableVersionSchema),
});
export type VersionsResponse = z.infer<typeof VersionsResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.string(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// --- user & team management (super users only) ---

export const AdminUserSchema = UserSchema.extend({
  teams: z.array(TeamSchema),
});
export type AdminUser = z.infer<typeof AdminUserSchema>;

export const UsersResponseSchema = z.object({
  users: z.array(AdminUserSchema),
});
export type UsersResponse = z.infer<typeof UsersResponseSchema>;

export const CreateUserRequestSchema = z.object({
  email: z.email(),
  name: z.string().min(1).optional(),
  isSuper: z.boolean().default(false),
});
export type CreateUserRequest = z.input<typeof CreateUserRequestSchema>;

// initialPassword is generated server-side and only ever returned here, once.
export const CreateUserResponseSchema = z.object({
  user: UserSchema,
  initialPassword: z.string(),
});
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;

export const CreateTeamRequestSchema = z.object({
  name: z.string().min(1).max(64),
});
export type CreateTeamRequest = z.infer<typeof CreateTeamRequestSchema>;

export const TeamResponseSchema = z.object({
  team: TeamSchema,
});
export type TeamResponse = z.infer<typeof TeamResponseSchema>;

export const TeamMemberRequestSchema = z.object({
  email: z.email(),
});
export type TeamMemberRequest = z.infer<typeof TeamMemberRequestSchema>;

// Set or clear a team's Paramify API key (super only). The key is write-only:
// it is stored server-side and never appears in any response.
export const SetTeamParamifyKeyRequestSchema = z.object({
  paramifyApiKey: z.string().min(1).nullable(),
});
export type SetTeamParamifyKeyRequest = z.infer<typeof SetTeamParamifyKeyRequestSchema>;

// --- Paramify validator sync ---

// The slice of a Paramify Validator the sync manages; the full object has more
// fields (regex, validation rules) that we never touch after creation.
export const ParamifyValidatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  statement: z.string(),
  type: z.string(),
});
export type ParamifyValidator = z.infer<typeof ParamifyValidatorSchema>;

export const ParamifyLinkSchema = z.object({
  team: z.string(),
  validatorId: z.string(),
  // Deliverable version last pushed to Paramify.
  syncedVersion: z.number().int(),
  // True only when the validator exists in Paramify and syncedVersion is current.
  inSync: z.boolean(),
  // Live validator from Paramify; null when it was deleted there or the live
  // check failed (`error` distinguishes the two).
  validator: ParamifyValidatorSchema.nullable(),
  // Deep link into the Paramify UI (requires PARAMIFY_URL on the server).
  url: z.string().nullable(),
  // Set when the live check could not be performed (instance unreachable,
  // missing configuration, rejected key).
  error: z.string().optional(),
});
export type ParamifyLink = z.infer<typeof ParamifyLinkSchema>;

export const ParamifyStatusResponseSchema = z.object({
  // Current deliverable version, for displaying drift next to syncedVersion.
  version: z.number().int(),
  links: z.array(ParamifyLinkSchema),
});
export type ParamifyStatusResponse = z.infer<typeof ParamifyStatusResponseSchema>;

// POST/PUT/DELETE on /paramify: which team's link to operate on. Optional when
// unambiguous (exactly one candidate team).
export const ParamifyLinkRequestSchema = z.object({
  team: z.string().optional(),
});
export type ParamifyLinkRequest = z.infer<typeof ParamifyLinkRequestSchema>;

export const ParamifyLinkResponseSchema = z.object({
  link: ParamifyLinkSchema,
});
export type ParamifyLinkResponse = z.infer<typeof ParamifyLinkResponseSchema>;

export const ParamifySyncResponseSchema = z.object({
  links: z.array(ParamifyLinkSchema),
});
export type ParamifySyncResponse = z.infer<typeof ParamifySyncResponseSchema>;
