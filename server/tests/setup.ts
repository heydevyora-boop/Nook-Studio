// Preloaded before every test file (see the "test" script in package.json).
// Must run before src/config/env.ts is imported, hence a separate file.
process.env.NODE_ENV = 'test'
process.env.INQUIRY_RATE_LIMIT_MAX = '1000' // the form is limited to 5/hour per IP in production
process.env.JWT_SECRET ??= 'test-secret-test-secret-123'
// Never fall back to a real database: the gateway tests don't need one, and
// the integration tests refuse to run unless DATABASE_URL names a "*test*" DB.
process.env.DATABASE_URL ??= 'postgresql://unused:unused@localhost:5432/unused_test'
