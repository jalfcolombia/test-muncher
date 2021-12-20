// Libraries
import queryString from "query-string";
import { Prisma, PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent } from "aws-lambda";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

// Interfaces
import { LambdaResponse } from "../types/types";

/**
 * Create a new purchase order
 */
export const create = async (
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  const data =
    typeof event.body === "string" ? queryString.parse(event.body) : event.body;
  const prisma = new PrismaClient();
  let answer: any;

  try {
    answer = await prisma.purchaseOrder.create({
      data: {
        users: {
          connect: {
            email: data?.email?.toString(),
          },
        },
      },
    });

    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      statusCode: 200,
      body: JSON.stringify({
        message: "La orden de compra fue registada",
        purchaseOrderID: answer.id,
      }),
    };
  } catch (error: PrismaClientKnownRequestError | any) {
    let statusCode = 200;
    let message = "";

    if (error?.code === "P2025") {
      statusCode = 400;
      message = "El usuario no se encuentra registrado";
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

/**
 * Add an item to an existing purchase order
 */
export const addItem = async (
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  const data =
    typeof event.body === "string" ? queryString.parse(event.body) : event.body;
  const prisma = new PrismaClient();
  let answer: any;

  try {

    answer = await prisma.purchaseOrderDetail.create({
      data: {
        quantity: Number(data?.quantity),
        PurchaseOrder: {
          connect: {
            id: data?.purchaseOrderID?.toString(),
          },
        },
        products: {
          connect: {
            id: data?.productID?.toString(),
          },
        },
      },
    });

    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      statusCode: 200,
      body: JSON.stringify({
        message: "El ítem fue agregado a la orden de compra correctamente",
        purchaseOrder: answer.id,
      }),
    };
  } catch (error: PrismaClientKnownRequestError | any) {
    let statusCode = 200;
    let message = "";

    if (error?.code === "P2025") {
      statusCode = 400;
      message = "La orden de compra no está registrada";
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

export const pay = async (
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  const purchaseOrderID = event.pathParameters?.purchaseOrderID ?? "";
  const prisma = new PrismaClient();
  let answer: any;

  try {
    answer = await prisma.$queryRaw(
      Prisma.sql`SELECT c.userId, a.prurchaseOrder, SUM(a.quantity * b.price) AS price
      FROM PurchaseOrderDetail a
      JOIN Product b ON b.id = a.productId
      JOIN PurchaseOrder c ON c.id = a.prurchaseOrder
      WHERE a.prurchaseOrder = ${purchaseOrderID}
      GROUP BY c.userId, a.prurchaseOrder`
    );

    if (answer.length > 0) {
      const price = answer[0].price;
      const userId = answer[0].userId;
      answer = await prisma.$queryRaw(
        Prisma.sql`SELECT id
        FROM User
        WHERE id = ${userId}
        AND (money - ${price}) > 0`
      );
      if (answer.length > 0) {

        // Update user
        await prisma.user.update({
          data: {
            money: {
              decrement: price,
            },
          },
          where: {
            id: userId,
          }
        });

        // Update purchase order
        await prisma.purchaseOrder.update({
          data: {
            paid: true,
            transactionAt: new Date()
          },
          where: {
            id: purchaseOrderID
          }
        });

      } else {
        throw new PrismaClientKnownRequestError(
          "El usuario no tiene el dinero suficiente para pagar la orden de compra",
          "E003",
          "0"
        );
      }
    } else {
      throw new PrismaClientKnownRequestError(
        "La orden de compra a pagar no está registrada",
        "E002",
        "0"
      );
    }

    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      statusCode: 200,
      body: JSON.stringify({
        message: "La orden de compra fue pagada exitosamente",
      }),
    };
  } catch (error: PrismaClientKnownRequestError | any) {
    let statusCode = 500;

    if (error?.code === "E002") {
      statusCode = 400;
    }

    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      statusCode,
      body: JSON.stringify({ errorCode: error?.code, message: error?.message }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
