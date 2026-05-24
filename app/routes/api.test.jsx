export async function loader() {
  return Response.json({
    apiKey: !!process.env.SHOPIFY_API_KEY,
    apiSecret: !!process.env.SHOPIFY_API_SECRET,
    appUrl: process.env.SHOPIFY_APP_URL,
    scopes: process.env.SCOPES,
  });
}