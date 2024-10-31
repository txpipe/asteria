import Link from "next/link";

export default function Landing() {
  return (
    <div className="w-full bg-starfield bg-cover bg-center relative">
      <div className="min-h-[calc(100vh-64px)] relative">
        <img src="/rocket.svg" className="pointer-events-none h-[50vh] absolute bottom-0 left-0" />
        <div className="min-h-[calc(100vh-64px)] container mx-auto sm pb-[10vh] flex flex-col justify-center text-center">
          <img src="/asteria.svg" className="pointer-events-none h-[11vh] mb-3" />
          <div className="flex flex-row justify-center items-center mb-[6vh]">
            <img src="/txpipe.png" className="h-[24px] mr-3" />
            <span className="font-inter-regular text-xl text-[#A0A0A0]">By TxPipe</span>
          </div>
          <h2 className="font-dmsans-regular text-2xl text-[#F1E9D9] mb-8 leading-relaxed">
            A <span className="font-dmsans-semibold">Cardano bot challenge</span> to showcase the<br/>capabilities of the <span className="font-dmsans-semibold">eUTxO model</span>.
          </h2>
          <div className="text-center">
            <Link href="/how-to-play">
              <button className="font-monocraft-regular text-black bg-[#07F3E6] py-4 px-8 rounded-full text-lg">
                How to play
              </button>
            </Link>
          </div>
        </div>
      </div>
      <div className="container mx-auto sm p-32">

        <img src="/landing-grid.svg" className="floating-grid" />

        <div className="p-20 rounded-[64px] backdrop-blur-sm bg-gradient-to-l from-[#FFFFFF0B] border-solid border-[3px] border-[#87FCF6] mb-64">
          <h3 className="font-monocraft-regular text-[#07F3E6] text-4xl mb-6">
            A 2D Space Game
          </h3>
          <p className="font-dmsans-regular text-[#F1E9D9] text-xl leading-relaxed">
            Players participate by moving a ship across a 2D grid and
            gathering resources. ADA rewards are available to players that
            reach the center of the grid. All interactions from participants
            happen through on-chain Cardano transactions.
          </p>
        </div>

        <div className="relative">
          <img src="/landing-ship-1.svg" className="floating-ship-1" />
          <img src="/landing-ship-2.svg" className="floating-ship-2" />

          <div className="p-20 rounded-[64px] backdrop-blur-sm bg-gradient-to-l from-[#FFFFFF0B] border-solid border-[3px] border-[#87FCF6] mb-64">
            <h3 className="font-monocraft-regular text-[#07F3E6] text-4xl mb-6">
              Move your ship
            </h3>
            <p className="font-dmsans-regular text-[#F1E9D9] text-xl leading-relaxed">
              Each player controls a spaceship, represented by an UTxO.
              Developers need to build their own bots (automated agents) that
              interact directly with the Cardano blockchain to move the ship
              in a 2D grid. The speed of the ship is constrained by an
              on-chain validator that we call "Spacetime".
            </p>
          </div>
        </div>

        <div className="relative">
          <img src="/landing-fuel-1.svg" className="floating-fuel-1" />
          <img src="/landing-fuel-2.svg" className="floating-fuel-2" />

          <div className="p-20 rounded-[64px] backdrop-blur-sm bg-gradient-to-l from-[#FFFFFF0B] border-solid border-[3px] border-[#87FCF6]">
            <h3 className="font-monocraft-regular text-[#07F3E6] text-4xl mb-6">
              Gather fuel
            </h3>
            <p className="font-dmsans-regular text-[#F1E9D9] text-xl leading-relaxed">
              To move around, ships require fuel which is represented by a
              Cardano native-token. Fuel is freely available at fixed
              coordinates in the grid, ships can gather the fuel if their
              coordinates overlap.
            </p>
          </div>
        </div>

      </div>
      <div className="container mx-auto sm flex flex-col pt-16 pb-32 px-32">
        <h3 className="flex flex-row items-center justify-center mb-20">
          <img src="/challenge-icon.svg" className="h-12 w-12 inline mr-5" />
          <span className="font-monocraft-regular text-[#07F3E6] text-4xl">Available Challenges</span>
        </h3>

        <div className="flex flex-row mx-[-1rem]">
          {[0,1,2].map(index =>
            <div key={index} className="mx-4 flex-auto rounded-2xl backdrop-blur-sm bg-[#14141470] overflow-hidden landing-challenge">
              <div className="w-full h-[240px] bg-challenge bg-center bg-cover" />
              <div className="p-8">
                <p className="mb-1 font-dmsans-regular text-[#6F6F6F] text-md">
                  Network | <span className="text-[#F1E9D9]">Preview</span>
                </p>
                <p className="mb-2 font-dmsans-regular text-[#6F6F6F] text-md">
                  Shipyard Policy | <span className="text-[#F1E9D9]">00000</span>
                </p>
                <p className="mb-4 font-dmsans-semibold text-white text-2xl">
                  Builder fest workshop
                </p>
                <div className="mb-4 flex flex-row items-center justify-between">
                  <button className="font-monocraft-regular text-[#07F3E6] border border-[#07F3E6] bg-transparent py-4 px-6 rounded-full text-lg flex-initial">
                    Play
                  </button>
                  <button className="border border-[#F1E9D9] bg-transparent p-4 rounded-full flex-initial">
                    <img src="/share-icon.svg" className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
