'use client'

import { useRouter } from 'next/navigation';

type Category = {
  id: string;
  name: string;
};

type Props = {
  categories: Category[];
  currentFilter?: string;
  currentCat?: string;
};

export default function CategoryFilters({ categories, currentFilter, currentCat }: Props) {
  const router = useRouter();

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, filter?: string, catId?: string) => {
    e.preventDefault();
    
    let url = '/?';
    if (filter) url += `filter=${filter}`;
    if (catId) url += `cat=${catId}`;
    url += '#catalogo';

    // Force hard reload to bypass all Next.js client caching
    window.location.assign(url);
  };

  return (
    <div className="flex flex-wrap justify-center gap-4 mb-16 px-4">
      <a 
        href="/#catalogo" 
        onClick={(e) => handleNavigation(e, undefined, undefined)}
        className={`text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase pb-2 border-b-2 transition-all hover:text-black hover:border-black ${!currentFilter && !currentCat ? 'border-amber-500 text-black' : 'border-transparent text-zinc-400'}`}
      >
        Todas
      </a>
      <a 
        href="/?filter=novidade#catalogo" 
        onClick={(e) => handleNavigation(e, 'novidade', undefined)}
        className={`text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase pb-2 border-b-2 transition-all hover:text-black hover:border-black ${currentFilter === 'novidade' ? 'border-amber-500 text-black' : 'border-transparent text-zinc-400'}`}
      >
        Novidades
      </a>
      <a 
        href="/?filter=atacado#catalogo" 
        onClick={(e) => handleNavigation(e, 'atacado', undefined)}
        className={`text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase pb-2 border-b-2 transition-all hover:text-black hover:border-black ${currentFilter === 'atacado' ? 'border-amber-500 text-black' : 'border-transparent text-zinc-400'}`}
      >
        Atacado
      </a>
      <a 
        href="/?filter=promocao#catalogo" 
        onClick={(e) => handleNavigation(e, 'promocao', undefined)}
        className={`text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase pb-2 border-b-2 transition-all hover:text-black hover:border-black ${currentFilter === 'promocao' ? 'border-amber-500 text-black' : 'border-transparent text-zinc-400'}`}
      >
        Promoção
      </a>
      
      <span className="text-zinc-300">|</span>
      
      {categories.map(cat => (
        <a 
          key={cat.id}
          href={`/?cat=${cat.id}#catalogo`}
          onClick={(e) => handleNavigation(e, undefined, cat.id)}
          className={`text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase pb-2 border-b-2 transition-all hover:text-black hover:border-black ${currentCat === cat.id ? 'border-amber-500 text-black' : 'border-transparent text-zinc-400'}`}
        >
          {cat.name}
        </a>
      ))}
    </div>
  );
}
