/** @type {import('next').NextConfig} */
const nextConfig = {
  // 개발 모드 최적화
  ...(process.env.NODE_ENV === 'development' && {
    // React Strict Mode 비활성화 (개발 시 성능 향상)
    reactStrictMode: false,
    
    // 개발 모드에서 불필요한 기능 비활성화
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // 개발 모드에서 소스맵 최적화
        config.devtool = 'cheap-module-source-map';
        
        // 번들 분할 최적화
        config.optimization = {
          ...config.optimization,
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false,
        };
      }
      return config;
    },
  }),
  
  // 프로덕션 최적화 (기본값)
  ...(process.env.NODE_ENV === 'production' && {
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
  }),
};

module.exports = nextConfig;
