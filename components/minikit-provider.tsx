import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";

export default async function Root({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <MiniKitProvider>
        <body>{children}</body>
      </MiniKitProvider>
    </html>
  );
}