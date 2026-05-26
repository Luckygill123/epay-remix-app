import prisma from "../db.server";

export async function loader() {

  const session =
    await prisma.session.findUnique({
      where: {
        id: "offline_epay-test-clientstore2.myshopify.com"
      }
    });

  return Response.json({
    id: session?.id,
    shop: session?.shop,
    token: session?.accessToken
  });
}