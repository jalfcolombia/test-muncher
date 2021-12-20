// Libraries
import queryString from "query-string";
import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent } from "aws-lambda";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

// Interfaces
import { LambdaResponse } from "../types/types";

/**
 * Create a new user
 */
export const create = async (
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  const data =
    typeof event.body === "string" ? queryString.parse(event.body) : event.body;
  const prisma = new PrismaClient();
  let answer: any;

  try {
    answer = await prisma.user.create({
      data: {
        name: data?.name?.toString() ?? "",
        email: data?.email?.toString() ?? "",
        money:
          typeof data?.money === "string" && Number(data?.money) > 0
            ? Number(data?.money)
            : 0,
      },
    });

    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      statusCode: 200,
      body: JSON.stringify({
        message: "El usuario fue registado correctamente",
      }),
    };
  } catch (error: PrismaClientKnownRequestError | any) {
    let statusCode = 200;
    let message = "";

    if (error?.code === "P2002") {
      statusCode = 400;
      message = "El usuario ya se encuentra registrado";
    } else {
      statusCode = 500;
      message = error?.message;
    }

    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      statusCode,
      body: JSON.stringify({ errorCode: error?.code, message }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
