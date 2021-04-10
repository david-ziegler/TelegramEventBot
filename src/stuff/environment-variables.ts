const { DATABASE_PATH, PORT, HOST } = process.env;
if (DATABASE_PATH === undefined) {
  throw new Error('Environment variable "DATABASE_PATH" is not set."');
}
if (PORT === undefined) {
  throw new Error(`Environment variable "PORT" is not set.`);
}
if (HOST === undefined) {
  throw new Error('Environment variable "HOST" is not set."');
}
export const ENV = { DATABASE_PATH, PORT, HOST };