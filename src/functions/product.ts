// Libraries
import queryString from "query-string";
import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent } from "aws-lambda";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

// Interfaces
import { LambdaResponse } from "../types/types";

/**
 * Create a new product
 */
export const create = async (
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  const data =
    typeof event.body === "string" ? queryString.parse(event.body) : event.body;
  const prisma = new PrismaClient();
  let answer: any;

  try {
    answer = await prisma.product.create({
      data: {
        name: data?.name?.toString() ?? '',
        reference: data?.reference?.toString() ?? '',
        price: Number(data?.price) ?? 0,
        initialQuantity: Number(data?.quantity) ?? 0,
        stock: Number(data?.quantity) ?? 0
      },
    });

    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      statusCode: 200,
      body: JSON.stringify({
        productID: answer.id,
        message: "El producto fue agregado correctamente",
      }),
    };
  } catch (error: PrismaClientKnownRequestError | any) {
    let statusCode = 200;
    let message = "";

    if (error?.code === "P2002") {
      statusCode = 400;
      message = "El producto que intenta agregar ya existe";
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
      body: JSON.stringify({ message }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
