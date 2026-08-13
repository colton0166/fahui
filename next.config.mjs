/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 部署用：產生自帶最小 node_modules 的 .next/standalone
  output: "standalone",
  // /api/lunar 在執行期以 process.cwd() 讀取此 JSON，
  // 需明確納入輸出檔案追蹤，否則 standalone 不會帶上它
  outputFileTracingIncludes: {
    "/api/lunar": ["./lunar_data_1910_2100_立春切歲22.json"],
  },
};

export default nextConfig;
