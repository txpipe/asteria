import Link from 'next/link';

export default function Landing() {
  return (
    <div className="w-full h-[calc(100vh-64px)] bg-starfield bg-cover bg-center relative">

      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-rocket bg-contain bg-left-bottom bg-no-repeat pointer-events-none" />
      
      <div className="container mx-auto sm h-full pb-[10vh] flex flex-col justify-center text-center">
        
        <h2 className="font-monocraft-regular text-4xl text-[#FFF75D] mb-3">
          The power of eUTxO model
        </h2>
        
        <h1 className="font-dmsans-bold text-7xl text-[#F1E9D9] mb-6 tracking-tighter">
          Asteria
        </h1>
        
        <h3 className="font-dmsans-regular text-2xl text-[#F1E9D9] mb-6 leading-relaxed mx-auto w-3/4">
          Asteria is an open hackathon, a bot challenge that leverages the eUTxO model. Players participate by moving a ship across a 2D grid and gathering resources.
          ADA rewards are available to players that reach the center of the gird. All interactions from participants happen through on-chain transactions, forcing the developer to learn about the UTxO Model.
          With ADA reward incentive and a compelling experience, we hope to attract developers from both inside and outside of the Cardano ecosystem
        </h3>

        <div className="text-center">
          <Link href="/how-to-play">
            <button className="font-monocraft-regular text-black bg-[#07F3E6] py-4 px-8 rounded-full text-lg">
              How to play
            </button>
          </Link>
        </div>
      
      </div>

    </div>
  );
}
