// app/routes/api.test.jsx

import prisma from "../db.server";

export async function loader() {
  const sessions = await prisma.session.findMany();

  return Response.json({
    sessions,
  });
}