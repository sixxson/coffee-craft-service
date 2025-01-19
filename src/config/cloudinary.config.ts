import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "your-cloud-name",
  api_key: "your-api-key",
  api_secret: "your-api-secret",
});

export default cloudinary;
