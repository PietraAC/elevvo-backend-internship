process.env.NODE_ENV = "test";
process.env.PORT = "3001";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://internship:internship@localhost:5433/task05_test?schema=public";
