import prisma from "../db.server";



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods":
    "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "*",
};
export async function options() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function loader({ request }) {
  try {
    const url = new URL(request.url);

    const orderId =
      url.searchParams.get("orderId");

    if (!orderId) {
      return Response.json(
        {
          success: false,
          error: "Missing orderId",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }



    const sessions =
      await prisma.session.findMany({
        where: {
          isOnline: false,
        },
      });

  

    for (const session of sessions) {
      try {
   

        const response =
          await fetch(
            `https://${session.shop}/admin/api/2026-07/graphql.json`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                "X-Shopify-Access-Token":
                  session.accessToken,
              },
              body: JSON.stringify({
                query: `
                  query GetOrder($id: ID!) {
                    order(id: $id) {
                      id
                      name
                      metafield(
                        namespace: "epay"
                        key: "result"
                      ) {
                        value
                      }
                    }
                  }
                `,
                variables: {
                  id: `gid://shopify/Order/${orderId}`,
                },
              }),
            }
          );



const data =
  await response.json();

 

        if (data.errors) {
  console.log(
    "GRAPHQL ERRORS:",
    JSON.stringify(
      data.errors,
      null,
      2
    )
  );
}






        const metafield =
          data?.data?.order?.metafield;

        if (metafield?.value) {
       
          

          return Response.json(
  JSON.parse(
    metafield.value
  ),
  {
    headers: corsHeaders,
  }
);
        }
 
        
      } catch (err) {
        console.log(
          "SHOP FAILED:",
          session.shop,
          err.message
        );
      }
    }

    return Response.json(
      {
        success: false,
        error:
          "ePay data not found",
      },
      {
        status: 404,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error(
      "GET ORDER ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}