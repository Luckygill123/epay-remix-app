export async function loader() {

  const response = await fetch(
    "https://econnect-images.epayworldwide.com/logos/google.jpg",
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "image/*,*/*",
      },
    }
  );

  const text = await response.text();

  return Response.json({
    status: response.status,
    contentType: response.headers.get("content-type"),
    first500: text.substring(0, 500),
  });
}