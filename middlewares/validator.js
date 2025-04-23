import Joi from "joi";

export const signupSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: {
        allow: ["com", "net"],
      },
    }),
  password: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")),
});

export const signinSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: {
        allow: ["com", "net"],
      },
    }),
  password: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")),
});

export const acceptCodeSchema = Joi.object({
  code: Joi.number().required(),
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: {
        allow: ["com", "net"],
      },
    }),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")),
  newPassword: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")),
});

export const acceptFPCodeSchema = Joi.object({
  code: Joi.number().required(),
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: {
        allow: ["com", "net"],
      },
    }),
  newPassword: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")),
});
