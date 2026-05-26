// app/routes/api.scopes.jsx

import prisma from "../db.server";

export async function loader() {
  const session = await prisma.session.findFirst();

  return Response.json({
    scope: session?.scope,
  });
}