import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image uploads go through a Server Action before the API/Cloudinary hop.
  // Default is 1MB; allow up to 6MB so 5MB files fit with multipart overhead.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
