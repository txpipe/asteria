import Link from "next/link";

export default function Landing() {
  return (
    <div className="w-full bg-starfield bg-cover bg-center relative">
      <div className="container mx-auto sm h-full pb-[10vh] flex flex-col justify-center text-center">
        <section className="p-20">
          <h1 className="font-dmsans-bold text-8xl text-[#F1E9D9] mb-6 tracking-tighter">
            Asteria
          </h1>
          <h2 className="font-monocraft-regular text-3xl text-[#FFF75D] max-w-3xl mx-auto">
            A Cardano bot challenge to showcase the capabilities of the eUTxO
            model.
          </h2>
          <div className="text-center">
            <Link href="/how-to-play">
              <button className="font-monocraft-regular text-black bg-[#07F3E6] py-4 px-8 rounded-full text-lg">
                How to play
              </button>
            </Link>
          </div>
        </section>
        <section className="mt-20">
          <div className="flex items-center mb-16">
            <div className="w-1/2">
              <div className="bg-gray-300 h-64 rounded-lg shadow-lg"></div>
            </div>
            <div className="w-1/2 pl-8">
              <h3 className="font-dmsans-bold text-2xl text-[#F1E9D9] mb-4">
                A 2D Space Game
              </h3>
              <p className="text-[#F1E9D9]">
                Players participate by moving a ship across a 2D grid and
                gathering resources. ADA rewards are available to players that
                reach the center of the grid. All interactions from participants
                happen through on-chain Cardano transactions.
              </p>
            </div>
          </div>

          <div className="flex items-center mb-16">
            <div className="w-1/2 pr-8">
              <h3 className="font-dmsans-bold text-2xl text-[#F1E9D9] mb-4">
                Move your ship
              </h3>
              <p className="text-[#F1E9D9]">
                Each player controls a spaceship, represented by an UTxO.
                Developers need to build their own bots (automated agents) that
                interact directly with the Cardano blockchain to move the ship
                in a 2D grid. The speed of the ship is constrained by an
                on-chain validator that we call "Spacetime".
              </p>
            </div>
            <div className="w-1/2">
              <div className="bg-gray-300 h-64 rounded-lg shadow-lg"></div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-1/2">
              <div className="bg-gray-300 h-64 rounded-lg shadow-lg"></div>
            </div>
            <div className="w-1/2 pl-8">
              <h3 className="font-dmsans-bold text-2xl text-[#F1E9D9] mb-4">
                Gather fuel
              </h3>
              <p className="text-[#F1E9D9]">
                To move around, ships require fuel which is represented by a
                Cardano native-token. Fuel is freely available at fixed
                coordinates in the grid, ships can gather the fuel if their
                coordinates overlap.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h3 className="font-dmsans-bold text-4xl text-[#F1E9D9] mb-4">
            Available Challenges
          </h3>
          <table className="mx-auto border-collapse border border-[#F1E9D9] text-[#F1E9D9]">
            <thead>
              <tr>
                <th className="border border-[#F1E9D9] p-3">Name</th>
                <th className="border border-[#F1E9D9] p-3">Network</th>
                <th className="border border-[#F1E9D9] p-3">Shipyard Policy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[#F1E9D9] p-3">
                  builder fest workshop
                </td>
                <td className="border border-[#F1E9D9] p-3">
                  <code className="bg-[#2D2D2D] px-2 py-1 rounded">
                    preview
                  </code>
                </td>
                <td className="border border-[#F1E9D9] p-3">
                  <code className="bg-[#2D2D2D] px-2 py-1 rounded">000000</code>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
