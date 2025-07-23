import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    console.log("☁️ Cloudinary Config:");
    console.log({
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "✅ PRESENT" : "❌ MISSING",
    });

    if (!localFilePath) {
      console.log("⚠️ Local file path missing");
      return null;
    }

    console.log(`📁 Uploading file: ${localFilePath}`);

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("✅ Upload Successful:", response);

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log(`🗑️ Local file deleted: ${localFilePath}`);
    }

    return response;
  } catch (error) {
    console.error("❌ Error uploading to Cloudinary:", error);

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log(`🗑️ Local file deleted after failure: ${localFilePath}`);
    }

    return null;
  }
};

export { uploadOnCloudinary };
