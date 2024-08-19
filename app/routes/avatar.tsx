  import { ActionFunction, json } from "@remix-run/node";
  import { requireUserId } from "~/utils/auth.server";
  import { prisma } from "~/utils/prisma.server";
  import { unstable_parseMultipartFormData, unstable_createMemoryUploadHandler } from "@remix-run/node";
  import path from "path";
  import { fileURLToPath } from "url";
  import fs from "fs/promises";
  import { v4 as uuidv4 } from "uuid";

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  async function UploadImage(request: Request): Promise<string | null> {
      const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const uploadHandler = unstable_createMemoryUploadHandler({
          maxPartSize: 10_000_000,
      });
      const formData = await unstable_parseMultipartFormData(request, uploadHandler);
      console.log(formData);
      const file = formData.get("file");

      console.log(file);

      if (!file || typeof file === "string") {
        return null;
      }

      const filename = `${uuidv4()}-${file?.name}`;
      const filePath = path.join(uploadDir, filename);

      await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

      return `/uploads/${filename}`;
  }

  export const action: ActionFunction = async ({ request }) => {


    const userId = await requireUserId(request);

    const imageUrl = await UploadImage(request);

    if (!imageUrl) {
      return json({ error: "No file uploaded" }, { status: 400 });
    }

    await prisma.user.update({
      data: {
        profile: {
          update: {
            profilePicture: imageUrl,
          },
        },
      },
      where: {
        id: userId,
      },
    });
    return json({ imageUrl });
  };
