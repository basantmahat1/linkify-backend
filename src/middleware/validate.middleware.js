import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) {
    console.error("Validation Error Details:", result.error.issues);
    const details = result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    return next(new ApiError(422, "Validation failed", details));
  }
  if (result.data.body) req.body = result.data.body;
  next();
};
