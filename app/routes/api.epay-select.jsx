import { authenticate } from "../shopify.server";

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
    const { admin } = await authenticate.admin(request);

    const {
      name,
      ean,
      provider,
      amount,
      shortDesc,
      longDesc,
    } = await request.json();

    const epay_id = ean.toString().trim();

    // Find existing product by SKU
    const existingResponse = await admin.graphql(`
      query {
        products(first: 100) {
          nodes {
            id
            handle
            variants(first: 1) {
              nodes {
                id
                sku
              }
            }
          }
        }
      }
    `);

    const existingData = await existingResponse.json();

    const existingProduct =
      existingData?.data?.products?.nodes?.find(
        (product) =>
          product.variants?.nodes?.[0]?.sku === epay_id
      );

    if (existingProduct) {
      return Response.json({
        success: true,
        reused: true,
        product_id: existingProduct.id,
        variant_id:
          existingProduct.variants.nodes[0].id,
        product_handle: existingProduct.handle,
      });
    }

    const createResponse = await admin.graphql(
      `
      mutation ProductCreate($product: ProductCreateInput!) {
        productCreate(product: $product) {
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
      {
        variables: {
          product: {
            title: `${name} - ${provider}`,
            descriptionHtml:
              longDesc || shortDesc || "",
            handle: buildProductHandle(
              epay_id,
              provider
            ),
            vendor: provider,
            productType: "Digital Code",
          },
        },
      }
    );

    const createData =
      await createResponse.json();

    const errors =
      createData?.data?.productCreate?.userErrors;

    if (errors?.length) {
      return Response.json(
        {
          success: false,
          errors,
        },
        { status: 400 }
      );
    }

    const product =
      createData.data.productCreate.product;

    return Response.json({
      success: true,
      created: true,
      product_id: product.id,
      variant_id:
        product.variants.nodes[0]?.id,
      product_handle: product.handle,
      price: formatPrice(amount),
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

export async function loader() {
  return Response.json({
    success: true,
    message: "GET works",
  });
}