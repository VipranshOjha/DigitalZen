import "./globals.css";

export const metadata = {
  title: "TrustMeBro AI",
  description: "The most confident AI on the internet.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}