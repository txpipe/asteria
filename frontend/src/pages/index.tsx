// Store
import { useChallengeStore } from '@/stores/challenge';

// Icons
import ChallengeIcon from '@/components/icons/ChallengeIcon';

// Home Components
import HeroSection from '@/components/home/HeroSection';

export default function Landing() {
  const { challenges, selected, select } = useChallengeStore();

  return (
    <div className="w-full bg-starfield bg-cover bg-center relative">
      <HeroSection />
      <div className="container mx-auto sm p-32">

        <img src="/landing-grid.svg" className="floating-grid" />

        <div className="p-20 rounded-[64px] backdrop-blur-xs bg-linear-to-l from-[#FFFFFF0B] border-solid border-[3px] border-[#87FCF6] mb-64">
          <h3 className="font-mono text-[#07F3E6] text-4xl mb-6">
            A 2D Space Game
          </h3>
          <p className="text-[#F1E9D9] text-xl leading-relaxed">
            Players participate by moving a ship across a 2D grid and
            gathering resources. ADA rewards are available to players that
            reach the center of the grid. All interactions from participants
            happen through on-chain Cardano transactions.
          </p>
        </div>

        <div className="relative">
          <img src="/landing-ship-1.svg" className="floating-ship-1" />
          <img src="/landing-ship-2.svg" className="floating-ship-2" />

          <div className="p-20 rounded-[64px] backdrop-blur-xs bg-linear-to-l from-[#FFFFFF0B] border-solid border-[3px] border-[#87FCF6] mb-64">
            <h3 className="font-mono text-[#07F3E6] text-4xl mb-6">
              Move your ship
            </h3>
            <p className="text-[#F1E9D9] text-xl leading-relaxed">
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

          <div className="p-20 rounded-[64px] backdrop-blur-xs bg-linear-to-l from-[#FFFFFF0B] border-solid border-[3px] border-[#87FCF6]">
            <h3 className="font-mono text-[#07F3E6] text-4xl mb-6">
              Gather fuel
            </h3>
            <p className="text-[#F1E9D9] text-xl leading-relaxed">
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
          <ChallengeIcon className="size-12 inline mr-5" />
          <span className="font-mono text-[#07F3E6] text-4xl">Available Challenges</span>
        </h3>

        <div className="flex flex-row justify-center -mx-4">
          {challenges.slice(0, 3).map((challenge, index) =>
            <div key={index} className="mx-4 flex-initial basis-1/3 rounded-2xl backdrop-blur-xs bg-[#14141470] overflow-hidden landing-challenge">
              <div className="w-full h-[240px] bg-challenge bg-center bg-cover" />
              <div className="p-8">
                <p className="mb-1 text-[#6F6F6F] text-base truncate">
                  Network | <span className="text-[#F1E9D9] capitalize">{ challenge.network }</span>
                </p>
                <p className="mb-2 text-[#6F6F6F] text-base truncate">
                  Spacetime Policy | <span className="text-[#F1E9D9]">{ challenge.spacetimePolicyId }</span>
                </p>
                <p className="mb-4 font-semibold text-white text-2xl truncate">
                  { challenge.label }
                </p>
                <div className="mb-4 flex flex-row items-center justify-between">
                  <button
                    onClick={() => select(index)}
                    disabled={selected === index}
                    className="font-mono text-[#07F3E6] border border-[#07F3E6] bg-transparent py-4 px-6 rounded-full text-lg flex-initial disabled:opacity-50"
                  >
                    Select
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
