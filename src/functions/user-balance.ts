// Libraries
import queryString from "query-string";
import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent } from "aws-lambda";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

// Interfaces
import { LambdaResponse } from "../types/types";

/**
 * Add balance to an existing user
 */
export const add = async (
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  const data =
    typeof event.body === "string" ? queryString.parse(event.body) : event.body;
  const prisma = new PrismaClient();

  try {

    const answer = await prisma.user.update({
      data: {
        money: {
          increment: Number(data?.money)
        }
      },
      where: {
        email: data?.email?.toString() ?? ""
      }
    });

    if (typeof answer.id === "undefined") {
      throw new PrismaClientKnownRequestError("El usuario no existe", "E001", "0");
    }

    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      statusCode: 200,
      body: JSON.stringify({
        message: "El balance del usuario fue actualizado",
      }),
    };
  } catch (error: PrismaClientKnownRequestError | any) {
    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      statusCode: 500,
      body: JSON.stringify({ errorCode: error?.code, message: error?.message }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
