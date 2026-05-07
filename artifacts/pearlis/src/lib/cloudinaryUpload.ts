const CLOUD_NAME = "drelvi6a3";
const UPLOAD_PRESET = "pearlis_upload";

export async function uploadToCloudinary(
  file: File | Blob,
  folder: string,
  resourceType: "image" | "video" | "auto" = "auto",
  filename?: string
): Promise<string> {
  const fd = new FormData();
  const name = filename || (file instanceof File ? file.name : "upload.png");
  fd.append(
    "file",
    file instanceof Blob && !(file instanceof File)
      ? new File([file], name, { type: file.type || "image/png" })
      : file
  );
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", `pearlis/${folder}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: fd }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Upload failed");
  }

  const data = await res.json();
  return data.secure_url as string;
}
