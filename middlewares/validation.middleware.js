import { ApiError } from "../utils/ApiError"




const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    })

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }))

      throw new ApiError(400, "Validation Error", errorMessages)
    }

    
    req[property] = value
    next()
  }
}

/**
 * Validate request body
 */
const validateBody = (schema) => validate(schema, "body")

/**
 * Validate query parameters
 */
const validateQuery = (schema) => validate(schema, "query")

/**
 * Validate route parameters
 */
const validateParams = (schema) => validate(schema, "params")

export { validate, validateBody, validateQuery, validateParams }
