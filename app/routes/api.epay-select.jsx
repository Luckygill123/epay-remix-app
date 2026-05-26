import prisma from "../db.server";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods":
    "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type",
};
export async function options() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type",
    },
  });
}

function formatPrice(amount) {
  const value = Number(amount);

  if (Number.isNaN(value) || value <= 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  return (value / 100).toFixed(2);
}

function buildProductHandle(epay_id, provider) {
  return `${epay_id}-${provider}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function action({ request }) {
  try {
console.time("epay-select");



    const body = await request.json();



   const {
  shop,
  name,
  ean,
  provider,
  amount,
  shortDesc,
  longDesc,
  image,
  imageBase64,
} = body;





    if (!shop) {
      return Response.json(
        {
          success: false,
          error: "shop is required",
        },
        
        { status: 400,
          headers: corsHeaders,
         }
      );
    }


    const session =
      await prisma.session.findUnique({
        where: {
          id: `offline_${shop}`,
        },
      });

      console.time("session");
console.timeEnd("session");

  

    if (!session) {
      return Response.json(
        {
          success: false,
          error: `No offline session found for ${shop}`,
        },
        { headers: corsHeaders, status: 404 }
      );
    }

const epay_id =
  ean.toString().trim();

const accessToken =
  session.accessToken;





console.time("sku-search");

const existingResponse =
  await fetch(
    `https://${shop}/admin/api/2025-10/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token":
          accessToken,
      },
      body: JSON.stringify({
        query: `
          query ($query: String!) {
            productVariants(
              first: 1,
              query: $query
            ) {
              nodes {
                id
                sku
                product {
                  id
                  handle
                }
              }
            }
          }
        `,
        variables: {
          query: `sku:${epay_id}`,
        },
      }),
    }
  );

const existingData =
  await existingResponse.json();

console.timeEnd("sku-search");

const existingVariant =
  existingData?.data
    ?.productVariants
    ?.nodes?.[0];

if (existingVariant) {

 

  return Response.json(
    {
      success: true,
      reused: true,
      product_id:
        existingVariant.product.id,
      variant_id:
        existingVariant.id,
      product_handle:
        existingVariant.product.handle,
    },
    {
      headers: corsHeaders,
    }
  );
}

    // Create product
console.time("product-create");

const createResponse =
  await fetch(
    `https://${shop}/admin/api/2025-10/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token":
          accessToken,
      },
      body: JSON.stringify({
        query: `
          mutation ProductCreate(
            $product: ProductCreateInput!
          ) {
            productCreate(
              product: $product
            ) {
              product {
                id
                title
                handle
                variants(first: 1) {
                  nodes {
                    id
                  }
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          product: {
            title:
              `${name} - ${provider}`,
            descriptionHtml:
              longDesc ||
              shortDesc ||
              "",
            handle:
              buildProductHandle(
                epay_id,
                provider
              ),
            vendor: provider,
            productType:
              "Digital Code",
          },
        },
      }),
    }
  );



const createText =
  await createResponse.text();



const createData =
  JSON.parse(createText);


console.timeEnd("product-create");

if (createData?.errors) {
 

  return Response.json(
    {
      success: false,
      graphqlErrors: createData.errors,
    },
    { headers: corsHeaders, status: 400 }

  );
}

const errors =
  createData?.data?.productCreate?.userErrors;

if (errors?.length) {


  return Response.json(
    {
      success: false,
      errors,
      createData,
    },
    { headers: corsHeaders, status: 400 },  
  );
}

    const product =
      createData.data.productCreate.product;


    const priceResponse = await fetch(
  `https://${shop}/admin/api/2025-10/graphql.json`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token":
        accessToken,
    },
    body: JSON.stringify({
      query: `
        mutation ProductVariantsBulkUpdate(
          $productId: ID!,
          $variants: [ProductVariantsBulkInput!]!
        ) {
          productVariantsBulkUpdate(
            productId: $productId,
            variants: $variants
          ) {
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        productId: product.id,
        variants: [
          {
            id: product.variants.nodes[0].id,
            price: (Number(amount) / 100).toFixed(2),
            inventoryItem: {
              sku: epay_id
            }
          }
        ]
      }
    })
  }
);

const priceData =
  await priceResponse.json();



const numericProductId =
  product.id.split("/").pop();

if (imageBase64) {

  const imageResponse =
    await fetch(
      `https://${shop}/admin/api/2025-10/products/${numericProductId}/images.json`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "X-Shopify-Access-Token":
            accessToken,
        },

        body: JSON.stringify({
          image: {
            attachment:
              imageBase64,
          },
        }),
      }
    );

  const imageData =
    await imageResponse.json();


}

console.time("publish");

const publishResponse =
  await fetch(
    `https://${shop}/admin/api/2025-10/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token":
          accessToken,
      },
      body: JSON.stringify({
        query: `
          mutation PublishProduct(
            $id: ID!,
            $input: [PublicationInput!]!
          ) {
            publishablePublish(
              id: $id,
              input: $input
            ) {
              publishable {
                publishedOnPublication(
                  publicationId:
                  "gid://shopify/Publication/197325717752"
                )
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          id: product.id,
          input: [
            {
              publicationId:
                "gid://shopify/Publication/197325717752",
            },
          ],
        },
      }),
    }
  );

const publishData =
  await publishResponse.json();


  if (
  publishData?.data
    ?.publishablePublish
    ?.userErrors?.length
) {
  
}


console.timeEnd("publish");


console.timeEnd("epay-select");

    return Response.json({
      success: true,
      created: true,
      product_id:
        product.id,
      variant_id:
        product.variants.nodes[0]?.id,
      product_handle:
        product.handle,
      price:
        formatPrice(amount),
    },
    {
  headers: corsHeaders,
}
  );

  } catch (error) {

    console.error(
    "FULL ERROR:",
    error
  );


    console.error(
      "EPAY SELECT ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          error.message,
        stack:
          error.stack,
      },
      {
        status: 500,
          headers: corsHeaders
      }
    );
  }
}

export async function loader() {
  return Response.json({
    success: true,
    message: "GET works",
  },
{
  headers: corsHeaders,
}
);
}