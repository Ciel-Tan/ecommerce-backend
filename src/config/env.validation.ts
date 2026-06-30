import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(8080),

  // database
  DB_HOST: z.string().min(1).default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string().min(1).default('postgres'),
  DB_PASSWORD: z.string().min(1).default('password'),
  DB_NAME: z.string().min(1).default('ecommerce'),

  //   // Redis
  //   REDIS_URL: z.string().optional(),
  //   REDIS_HOST: z.string().optional(),
  //   REDIS_PORT: z.coerce.number().optional(),
  //   REDIS_PASSWORD: z.string().optional(),

  // Throttler
  THROTTLE_TTL_MS: z.coerce.number().default(1000),
  THROTTLE_LIMIT: z.coerce.number().default(60),

  //   // Auth
  //   BETTER_AUTH_SECRET: z.string().min(1),
  //   BETTER_AUTH_URL: z.string().url(),
  //   BETTER_AUTH_SAMESITE_NONE: z.string().optional(),
  //   BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),

  //   // CORS
  //   CLIENT_URL: z.string().optional(),
  //   NEXT_PUBLIC_APP_URL: z.string().optional(),
  //   LANDING_PAGE_URL: z.string().optional(),
  //   ADMIN_PANEL_URL: z.string().optional(),
  //   CORS_OTHER_ORIGINS: z.string().optional(),

  //   //Email
  //   SMTP_USER: z.string().optional(),
  //   SMTP_PASS: z.string().optional(),
  //   SMTP_FROM: z.string().optional(),

  //   // Elasticsearch
  //   ELASTICSEARCH_NODE: z.string().optional(),
  //   ELASTICSEARCH_USERNAME: z.string().optional(),
  //   ELASTICSEARCH_PASSWORD: z.string().optional(),

  //   // Supabase
  //   SUPABASE_URL: z.string().url().optional(),
  //   SUPABASE_ANON_KEY: z.string().optional(),
  //   SUPABASE_BUCKET_NAME: z.string().optional(),

  //   // PayOS
  //   PAYOS_CLIENT_ID: z.string().optional(),
  //   PAYOS_API_KEY: z.string().optional(),
  //   PAYOS_CHECKSUM_KEY: z.string().optional(),
  //   PAYOS_RETURN_URL: z.string().optional(),
  //   PAYOS_CANCEL_URL: z.string().optional(),

  //   // Guest pool
  //   GUEST_POOL_USER_ID: z.string().optional(),
});

// z.infer is a utility type that infers the type from the schema
// when updating the schema, make sure to update the type as well
export type Env = z.infer<typeof envSchema>;

// this function validates the environment variables
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => ` - ${i.path.join('.')} : ${i.message}`)
      .join('\n');

    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return parsed.data;
}
