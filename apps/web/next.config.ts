/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@imgly/background-removal-node",
    "onnxruntime-node",
    "@prisma/client",
    "tesseract.js",
    "sharp"
  ],
};

export default nextConfig;
