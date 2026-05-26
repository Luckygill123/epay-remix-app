import prisma from "../db.server";

export async function loader() {

  await prisma.session.delete({
    where: {
      id: "offline_epay-test-clientstore2.myshopify.com"
    }
  });

  return Response.json({
    success: true
  });
}