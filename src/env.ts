import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  BACKEND_URL: { schema: value => value ?? '' },
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: { public: true, schema: value => value ?? '' },
  NEXT_PUBLIC_APPLE_CLIENT_ID: { public: true, schema: value => value ?? '' },
  NEXT_PUBLIC_APPLE_REDIRECT_URI: { public: true, schema: value => value ?? '' },
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: { public: true, schema: value => value ?? '' },
});
