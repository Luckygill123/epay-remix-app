import prisma from "../db.server";

export async function action({ request }) {
  try {

    const payload = await request.json();

    console.log(
      "ORDER PAID WEBHOOK:",
      payload
    );

    const orderId = payload.id;

    const shop =
      request.headers.get(
        "x-shopify-shop-domain"
      );

    console.log(
      "ORDER:",
      orderId
    );

    console.log(
      "SHOP:",
      shop
    );

    const session =
      await prisma.session.findFirst({
        where: {
          shop,
          isOnline: false,
        },
      });

    if (!session) {

      console.log(
        "NO SESSION FOUND"
      );

      return Response.json({
        success: false,
      });
    }

    const accessToken =
      session.accessToken;

    console.log(
      "TOKEN FOUND"
    );

    /*
      CALL EPAY HERE

      Example:

      const epayResponse =
        await fetch(...);

      const epayResult =
        await epayResponse.json();

      Then save result to Shopify order metafield
    */

    return Response.json({
      success: true,
    });

  } catch (error) {

    console.error(error);

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}