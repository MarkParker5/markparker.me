const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.BUNDLE_ANALYZE === 'browser' || process.env.BUNDLE_ANALYZE === 'both',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export for GitHub Pages. Replaces the old `next export` command
  // (removed in Next 14): `next build` now emits the site to `out/` directly,
  // producing `foo.html` per route just like the previous export step did.
  output: 'export',
  // Static export can't use the Image Optimization server. Every image here is a
  // plain <img> on a public/ path, so this is just a safety net for that constraint.
  images: { unoptimized: true },
}

module.exports = withBundleAnalyzer(nextConfig)
