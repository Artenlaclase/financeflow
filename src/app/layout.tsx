import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Fintracker App",
  description: "Aplicación web para la gestión de finanzas personales, enfocada en brindar a los usuarios una visión clara de sus ingresos, gastos, deudas y ahorros de forma centralizada y visual.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
