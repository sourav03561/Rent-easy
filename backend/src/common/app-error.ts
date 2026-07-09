export class AppError extends Error {
  statusCode: number;
  errors: unknown;

  constructor(message: string, statusCode = 500, errors: unknown = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const notFound = (resource = "Resource") => new AppError(`${resource} not found`, 404);
