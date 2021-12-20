// Libraries
import md5 from "md5";
import queryString from "query-string";
import { Prisma, PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent } from "aws-lambda";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

// Interfaces
import { LambdaResponse } from "../types/types";

/**
 * Transfer money between system users
 */
export const transfer = async (
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  const data =
    typeof event.body === "string" ? queryString.parse(event.body) : event.body;
  const prisma = new PrismaClient();

  try {
    const userForm: Array<{ id: string }> = await prisma.$queryRaw(
      Prisma.sql`SELECT id
      FROM User
      WHERE email = ${data?.from}
      AND (money - ${data?.money}) >= 0`
    );

    if (userForm.length > 0) {
      const userTo: Array<{ id: string }> = await prisma.$queryRaw(
        Prisma.sql`SELECT id
        FROM User
        WHERE email = ${data?.to}`
      );
      if (userTo.length > 0) {

        // Register transfer
        await prisma.transaction.create({
          data: {
            userIdForm: userForm[0].id,
            userIdTo: userTo[0].id,
            quantity: Number(data?.money),
            hashTransaction: md5(`SEED-PreviousTransferHash-${userForm[0].id}-${userTo[0].id}-${Number(data?.money)}`)
          },
        });

        // Update user from
        await prisma.user.update({
          data: {
            money: {
              decrement: Number(data?.money)
            }
          },
          where: {
            id: userForm[0].id
          }
        });

        // Update user to
        await prisma.user.update({
          data: {
            money: {
              increment: Number(data?.money)
            }
          },
          where: {
            id: userTo[0].id
          }
        });

      } else {
        throw new PrismaClientKnownRequestError(
          "El usuario de destino no existe en el sistema",
          "E005",
          "0"
        );
      }
    } else {
      throw new PrismaClientKnownRequestError(
        "El usuario que envía el dinero o no existe o no tiene los fondos suficientes para realizar dicha transferencia",
        "E004",
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
        message: "La transferencia fue realizada exitosamente",
      }),
    };
  } catch (error: PrismaClientKnownRequestError | any) {
    let statusCode = 200;

    if (["E004", "E005"].includes(error?.code) === true) {
      statusCode = 400;
    } else {
      statusCode = 500;
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
