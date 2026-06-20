import Link from 'next/link';
import { getAllVietlottProducts } from '@/lib/vietlott/catalog';

export function VietlottTabs({ active }: { active?: string }) {
  return (
    <nav className="marketTabs vietlottTabs" aria-label="Sản phẩm Vietlott">
      {getAllVietlottProducts().map((product) => (
        <Link href={`/vietlott/${product.id}`} data-active={active === product.id ? 'true' : undefined} key={product.id}>
          {product.shortName}
        </Link>
      ))}
    </nav>
  );
}
