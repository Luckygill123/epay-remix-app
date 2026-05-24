import shopify from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }) {
  try {
    const url = new URL(request.url);

    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      return Response.json(
        {
          error: "Missing orderId",
        },
        {
          status: 400,
        }
      );
    }

    // Load installed shop's offline session
    const session = await prisma.session.findFirst({
      where: {
        id: {
          startsWith: "offline_",
        },
      },
    });

    if (!session) {
      return Response.json(
        {
          error: "Offline session not found",
        },
        {
          status: 404,
        }
      );
    }

    const client =
      new shopify.api.clients.Graphql({
        session,
      });

    const response = await client.request(
      `
      query GetOrder($id: ID!) {
        order(id: $id) {
          metafield(
            namespace: "epay"
            key: "result"
          ) {
            value
          }
        }
      }
      `,
      {
        variables: {
          id: `gid://shopify/Order/${orderId}`,
        },
      }
    );

    const metafield =
      response?.data?.order?.metafield;

    if (!metafield) {
      return Response.json(null);
    }

    return Response.json(
      JSON.parse(metafield.value)
    );

  } catch (error) {
    console.error(
      "GET ORDER EPAY ERROR:",
      error
    );

    return Response.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}