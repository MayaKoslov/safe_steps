export const metadata = {
  title: 'safe_steps',
  description: 'Safe steps-because every woman deserves to move through her city with confidence',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Leaflet CSS required for interactive maps */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}