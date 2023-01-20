const withBundleAnalyzer = require("@zeit/next-bundle-analyzer");
const withImages = require('next-images')
const withMdx = require("@next/mdx")({
  options: {
    providerImportSource: "@mdx-js/react",
  }
});

module.exports = withMdx(withImages(withBundleAnalyzer({
  webpack(config) {
    // config.optimization.usedExports = true
    return config
  },
  analyzeServer: ["server", "both"].includes(process.env.BUNDLE_ANALYZE),
  analyzeBrowser: ["browser", "both"].includes(process.env.BUNDLE_ANALYZE),
  bundleAnalyzerConfig: {
    server: {
      analyzerMode: 'static',
      reportFilename: '../bundles/server.html'
    },
    browser: {
      analyzerMode: 'static',
      reportFilename: '../bundles/client.html'
    }
  }
})))
