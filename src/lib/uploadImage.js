const MAX_IMAGE_SIDE = 1600;

// আপলোডের আগেই ছবি ছোট করা — ধীর Net এও দ্রুত যায়
const compressImage = async (file) => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  return blob && blob.size < file.size ? blob : file;
};

// ছবি Browser থেকে সরাসরি Cloudinary তে যায়, আমাদের Server এ চাপ পড়ে না
export const uploadImage = async (file, signature) => {
  const image = await compressImage(file).catch(() => file);

  const form = new FormData();
  form.append("file", image);
  form.append("api_key", signature.apiKey);
  form.append("timestamp", signature.timestamp);
  form.append("folder", signature.folder);
  form.append("allowed_formats", signature.allowed_formats);
  form.append("transformation", signature.transformation);
  form.append("signature", signature.signature);
  if (signature.type) form.append("type", signature.type);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Upload failed");

  return {
    publicId: result.public_id,
    version: result.version,
    signature: result.signature,
    url: result.secure_url,
    format: result.format,
  };
};
