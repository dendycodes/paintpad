import "./globals.scss";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head />
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
