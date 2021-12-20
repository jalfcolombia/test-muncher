import Joi from "joi";
import queryString from "query-string";
import { LambdaResponse } from "../types/types";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { mapErrorsHook } from "../hooks/map-errors.hook";

export const validateCreate = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<LambdaResponse | void> => {
  const data =
    typeof event.body === "string" ? queryString.parse(event.body) : event.body;

  let schema = Joi.object({
    name: Joi.string().max(100).required().messages({
      "string.base": `El dato no es una cadena de caracteres`,
      "string.max": `El límite máximo de caracteres es {#limit}`,
      "string.empty": `El campo es requerido`,
    }),
    email: Joi.string().max(100).required().email().messages({
      "string.base": `El dato no es un correo valido`,
      "string.max": `El límite máximo de caracteres es {#limit}`,
      "string.empty": `El campo es requerido`,
      "string.email": `El correo digitado no es valido`,
    }),
  });

  if (typeof data?.money === "string" && Number(data?.money) > 0) {
    schema = schema.append({
      money: Joi.number().integer().greater(1).required().messages({
        "number.base": `El dato no es un número valido`,
        "number.greater": `La cantidad debe ser mayor que {#limit}`,
        "number.integer": `El número digitado debe ser un número entero`,
      }),
    });
  } else {
    schema = schema.append({
      money: Joi.string().allow(null, ""),
    });
  }

  const dataValidate = schema.validate(data, { abortEarly: false });
  if (dataValidate.error) {
    const errors = mapErrorsHook(dataValidate.error);
    context.end();
    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      statusCode: 400,
      body: JSON.stringify({ errors }),
    };
  }
};

export const validateAddBalance = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<LambdaResponse | void> => {
  const data =
    typeof event.body === "string" ? queryString.parse(event.body) : event.body;

  let schema = Joi.object({
    email: Joi.string().max(100).required().email().messages({
      "string.base": `El dato no es un correo valido`,
      "string.max": `El límite máximo de caracteres es {#limit}`,
      "string.empty": `El campo es requerido`,
      "string.email": `El correo digitado no es valido`,
    }),
    money: Joi.number().integer().greater(1).required().messages({
      "number.base": `El dato no es un número valido`,
      "number.greater": `La cantidad debe ser mayor que {#limit}`,
      "number.integer": `El número digitado debe ser un número entero`,
    }),
  });

  const dataValidate = schema.validate(data, { abortEarly: false });
  if (dataValidate.error) {
    const errors = mapErrorsHook(dataValidate.error);
    context.end();
    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      statusCode: 400,
      body: JSON.stringify({ errors }),
    };
  }
};
