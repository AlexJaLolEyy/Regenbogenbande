/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
      config.module.rules.push({
        test: /\.(mp4|webm|ogg)$/,
        use: {
          loader: 'file-loader',
          options: {
            publicPath: `/_next/static/videos/`,
            outputPath: `static/videos/`,
            name: '[name].[hash].[ext]',
          },
        },
      });
  
      return config;
    },
  };
  
  module.exports = nextConfig;
  // TODO: remove after switching to real data