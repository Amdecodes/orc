/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@imgly/background-removal-node",
    "onnxruntime-node",
  ],
};

export default nextConfig;
