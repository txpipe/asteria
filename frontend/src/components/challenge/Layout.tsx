import type { PropsWithChildren } from 'react';

import MdxLayout from '@/components/how-to-play/mdx/Layout';

interface ChallengeLayoutProps extends PropsWithChildren {

}

export default function ChallengeLayout({ children }: ChallengeLayoutProps) {
  return (
    <div className="min-h-[calc(100dvh-72px)] bg-starfield bg-cover bg-center relative py-4">
      <div className="container mx-auto max-w-7xl bg-[#141414]/70 border border-[#07F3E6]/40 rounded-xl px-6 py-3">
        <MdxLayout>{children}</MdxLayout>
      </div>
    </div>
  );
}