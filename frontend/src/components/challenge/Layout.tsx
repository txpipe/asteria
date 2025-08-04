import type { PropsWithChildren } from 'react';

import MdxLayout from '@/components/how-to-play/mdx/Layout';

interface ChallengeLayoutProps extends PropsWithChildren {

}

export default function ChallengeLayout({ children }: ChallengeLayoutProps) {
  return (
    <div className="min-h-[calc(100dvh-72px)] bg-starfield bg-cover bg-center relative">
      <div className="container mx-auto">
        <MdxLayout>{children}</MdxLayout>
      </div>
    </div>
  );
}