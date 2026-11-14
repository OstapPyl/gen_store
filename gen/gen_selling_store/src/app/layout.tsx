import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/components/CartContext';

export const metadata: Metadata = {
  title: 'Gen — Інтернет-магазин генераторів та резервного живлення в Україні',
  description: 'Професійний підбір та продаж генераторів: інверторні, бензинові, дизельні, двопаливні. Офіційна гарантія та доставка по всій Україні.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className="h-full">
      <body className="flex flex-col min-h-screen bg-graphite-50 text-graphite-900 selection:bg-brand-500 selection:text-white">
        <CartProvider>
          <Header />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
