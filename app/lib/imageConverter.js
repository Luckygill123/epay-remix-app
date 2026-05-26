import sharp from "sharp";

export async function convertToJpgBase64(imageUrl) {
  const res = await fetch(imageUrl, {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "image/*,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(
      `Image download failed: ${res.status}`
    );
  }

  const contentType =
  res.headers.get("content-type");

console.log(
  "CONTENT TYPE:",
  contentType
);

  const arrayBuffer =
    await res.arrayBuffer();

  const buffer =
    Buffer.from(arrayBuffer);

    console.log(
  "BUFFER LENGTH:",
  buffer.length
);

console.log(
  "FIRST BYTES:",
  buffer
    .slice(0, 30)
    .toString()
);

const metadata =
  await sharp(buffer).metadata();

console.log(
  "IMAGE META:",
  metadata
);



const jpgBuffer =
  await sharp(buffer)
    .jpeg({
      quality: 90,
    })
    .toBuffer();

return jpgBuffer.toString("base64");
}