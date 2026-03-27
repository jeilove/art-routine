import type { NextConfig } from "next";

// Turbopack은 --no-turbopack 플래그로 CLI에서 비활성화 (BMI2 미지원 CPU 대응)
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Private-Network',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
