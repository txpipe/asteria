
export default function Leaderboard() {
  return (
    <div className="container 2xl mx-auto p-8 min-h-[calc(100vh-64px)]">
      
      <div className="flex flex-row items-center mb-12">
        <h1 className="flex-auto mr-6 font-monocraft-regular text-4xl text-[#FFF75D]">
          DISTANCE TO ASTERIA
        </h1>
        <input
          type="text"
          placeholder="Type your ADDRESS / SHIP NAME"
          className="flex-initial basis-2/5 mr-6 px-6 py-4 rounded-3xl bg-[#242424] border-transparent focus:border-[#919090] text-[#919090] focus:ring-0"
        />
        <button className="flex-initial font-monocraft-regular text-black bg-[#07F3E6] py-4 px-8 rounded-full text-md">
          Find me
        </button>
      </div>

      <div className="flex flex-row justify-center items-center mb-12">
        {[1,2,3].map(index =>
          <div key={index} className="flex-initial flex flex-row items-center mx-4 pl-8 pr-6 py-4 rounded-full bg-gradient-to-r from-[#46434312] to-[#FFFFFF12]">
            <h1 className="flex-initial pb-1 mr-6 font-monocraft-regular text-5xl text-[#07F3E6]">
              {index}
            </h1>
            <div className="flex-initial mr-6 p-4 rounded-full bg-[#FFFFFF08] border-b-[#333] border-b-solid border-b">
              <img className="w-8 h-8" src={`/ships/ship_${Math.round(Math.random()*6)}.svg`} />
            </div>
            <p className="flex-initial mr-6 font-dmsans-regular text-white">
              <span className="font-dmsans-bold">Pilot: </span> ABC123<br/>
              <span className="font-dmsans-bold">Ship: </span> ABC12
            </p>
            <div className="flex-initial py-2 px-4 rounded-full bg-[#E7ECEF] font-dmsans-regular text-[#171717]">
              {`${index*10}km`}
            </div>
          </div>
        )}
      </div>

      <table className="w-full mb-12 border-collapse border border-[#333333]">
        <thead>
          <tr>
            {['Ranking', 'Address', 'Ship name', 'Pilot name', 'Fuel', 'Movements', 'Distance'].map(header =>
              <th className="p-4 font-dmsans-regular text-[#FAFAFA] text-left border border-[#333333]">{header}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {[1,2,3,4,5,6,7,8,9,10].map(index =>
            <tr key={index}>
              <td className="p-4 font-dmsans-regular text-[#07F3E6] text-left border border-[#333333]">
                {index}
              </td>
              <td className="p-4 font-dmsans-regular text-[#D7D7D7] text-left border border-[#333333]">
                <img className="inline mr-4 w-8 h-8" src={`/ships/ship_${Math.round(Math.random()*6)}.svg`} />
                <span>0x32Be343B94f860124dC4fEe278FDCBD38C102D88</span>
              </td>
              <td className="p-4 font-dmsans-regular text-[#D7D7D7] text-left border border-[#333333]">
                ABC123
              </td>
              <td className="p-4 font-dmsans-regular text-[#D7D7D7] text-left border border-[#333333]">
                ABC123
              </td>
              <td className="p-4 font-dmsans-regular text-[#D7D7D7] text-left border border-[#333333]">
                3000
              </td>
              <td className="p-4 font-dmsans-regular text-[#D7D7D7] text-left border border-[#333333]">
                10
              </td>
              <td className="p-4 text-left border border-[#333333]">
                <span className="py-2 px-4 rounded-full bg-[#E7ECEF] font-dmsans-regular text-[#171717]">
                  {`${index*10}km`}
                </span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex flex-row justify-center items-center mb-12">
        <p className="flex-initial font-dmsans-regular text-[#848484] mr-8">
          Displaying 1-10 of 100
        </p>
        <button className="flex-initial w-12 h-12 font-monocraft-regular text-black bg-[#AFAFAF] p-3 rounded-xl text-md mr-4">
          {`<`}
        </button>
        <button className="flex-initial w-12 h-12 font-monocraft-regular text-black bg-[#07F3E6] p-3 rounded-xl text-md">
          {`>`}
        </button>
      </div>

    </div>
  );
}
