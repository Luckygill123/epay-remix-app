import prisma from "../db.server";

export async function loader() {
  const session = await prisma.session.findFirst({
    where: {
      shop: "epay-test-clientstore2.myshopify.com",
    },
  });

  if (!session) {
    return Response.json({
      error: "No session found",
    });
  }

  const response = await fetch(
    `https://${session.shop}/admin/api/2025-10/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token":
          session.accessToken,
      },
      body: JSON.stringify({
        query: `
          query {
            publications(first: 20) {
              nodes {
                id
                name
              }
            }
          }
        `,
      }),
    }
  );

  const data = await response.json();

  return Response.json(data);
}