import prisma from "../db.server";

export async function loader({ request }) {
  try {
    const sessions =
      await prisma.session.findMany();

    return Response.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
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