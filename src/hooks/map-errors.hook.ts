import { ValidationError } from "joi";
import { IMapError } from "../types/map-error";

export const mapErrorsHook = (error: ValidationError): IMapError => {
  const errorResult: IMapError = {};
  error.details.forEach((detail) => {
    if (detail.context && detail.context.label) {
      errorResult[detail.context.label] = detail.message;
    }
  });
  return errorResult;
}
