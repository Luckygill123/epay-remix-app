import sharp from "sharp";

export async function convertToJpgBase64(
  imageUrl
) {
  const res =
    await fetch(imageUrl);

  if (!res.ok) {
    throw new Error(
      `Image download failed: ${res.status}`
    );
  }

  const arrayBuffer =
    await res.arrayBuffer();

  const jpgBuffer =
    await sharp(
      Buffer.from(arrayBuffer)
    )
      .jpeg({
        quality: 90,
      })
      .toBuffer();

  return jpgBuffer.toString(
    "base64"
  );
}