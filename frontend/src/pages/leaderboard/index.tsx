import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useChallengeStore } from '@/stores/challenge';

const PAGE_SIZE = 10;

const GET_LEADERBOARD_RECORDS = gql`
  query Leaderboard($shipyardPolicyId: String) {
    leaderboard(shipyardPolicyId: $shipyardPolicyId) {
      ranking,
      address,
      shipName,
      pilotName,
      fuel,
      distance
    }
  }
`;

interface LeaderboardQueryResult {
  leaderboard: LeaderboardRecord[];
}

interface LeaderboardRecord {
  ranking: number;
  address: string;
  shipName: string;
  pilotName: string;
  fuel: number;
  distance: number;
}

interface RecordProps {
  record: LeaderboardRecord;
}

const getShipByAddress = (address: string): string => {
  const encoder = new TextEncoder();
  const charCode = encoder.encode(address.charAt(address.length-3))[0];
  return `/ships/ship_${Math.round(charCode%7)}.svg`;
}

const LeaderboardChip: React.FunctionComponent<RecordProps> = (props: RecordProps) => (
  <div className="flex-initial flex flex-row items-center mx-4 pl-8 pr-6 py-4 rounded-full bg-gradient-to-r from-[#46434312] to-[#FFFFFF12]">
    <h1 className="flex-initial pb-1 mr-6 font-monocraft-regular text-5xl text-[#07F3E6]">
      {props.record.ranking}
    </h1>
    <div className="flex-initial mr-6 p-4 rounded-full bg-[#FFFFFF08] border-b-[#333] border-b-solid border-b">
      <img className="w-8 h-8" src={getShipByAddress(props.record.address)} />
    </div>
    <p className="flex-initial mr-6 font-dmsans-regular text-white">
      <span className="font-dmsans-bold">Pilot: </span> {props.record.pilotName.toUpperCase().slice(-6)}<br/>
      <span className="font-dmsans-bold">Ship: </span> {props.record.shipName.toUpperCase().slice(-6)}
    </p>
    <div className="flex-initial py-2 px-4 rounded-full bg-[#E7ECEF] font-dmsans-regular text-[#171717]">
      {`${props.record.distance}km`}
    </div>
  </div>
);

const LeaderboardRow: React.FunctionComponent<RecordProps> = (props: RecordProps) => (
  <tr>
    <td className="p-4 font-dmsans-regular text-[#07F3E6] text-left border border-[#333333]">
      {props.record.ranking}
    </td>
    <td className="p-4 font-dmsans-regular text-[#D7D7D7] text-left border border-[#333333]">
      <img className="inline mr-4 w-8 h-8" src={getShipByAddress(props.record.address)} />
      <span>{props.record.address.replace('#0', '')}</span>
    </td>
    <td className="p-4 font-dmsans-regular text-[#D7D7D7] text-left border border-[#333333]">
      {props.record.pilotName.toUpperCase().slice(-6)}
    </td>
    <td className="p-4 font-dmsans-regular text-[#D7D7D7] text-left border border-[#333333]">
     {props.record.shipName.toUpperCase().slice(-6)}
    </td>
    <td className="p-4 font-dmsans-regular text-[#D7D7D7] text-left border border-[#333333]">
      {props.record.fuel}
    </td>
    <td className="p-4 text-left border border-[#333333]">
      <span className="py-2 px-4 rounded-full bg-[#E7ECEF] font-dmsans-regular text-[#171717]">
        {`${props.record.distance}km`}
      </span>
    </td>
  </tr>
);

export default function Leaderboard() {
  const { current } = useChallengeStore();
  const { loading, error, data } = useQuery<LeaderboardQueryResult>(GET_LEADERBOARD_RECORDS, { variables: { shipyardPolicyId: current().policyId } });
  const [ offset, setOffset ] = useState<number>(0);

  const hasNextPage = () => {
    return data && data.leaderboard && offset + PAGE_SIZE < data.leaderboard.slice(3).length;
  }

  const nextPage = () => {
    if (hasNextPage()) {
      setOffset(offset + PAGE_SIZE);
    }
  }

  const hasPrevPage = () => {
    return offset - PAGE_SIZE >= 0;
  }

  const prevPage = () => {
    if (hasPrevPage()) {
      setOffset(offset - PAGE_SIZE);
    }
  }

  const getPageData = () => {
    if (!data || !data.leaderboard) return [];
    return data.leaderboard.slice(3).slice(offset, offset+PAGE_SIZE);
  }

  return (
    <div className="container 2xl mx-auto p-8 min-h-[calc(100vh-64px)]">
      
      <div className="flex flex-row items-center mb-12">
        <h1 className="flex-auto mr-6 font-monocraft-regular text-4xl text-[#FFF75D]">
          DISTANCE TO ASTERIA
        </h1>
        <input
          type="text"
          placeholder="Type your ADDRESS / SHIP NAME"
          className="form-input flex-initial basis-2/5 mr-6 px-6 py-4 rounded-3xl bg-[#242424] border-transparent focus:border-[#919090] text-[#919090] focus:ring-0"
        />
        <button className="flex-initial font-monocraft-regular text-black bg-[#07F3E6] py-4 px-8 rounded-full text-md">
          Find me
        </button>
      </div>

      <div className="flex flex-row justify-center items-center mb-12">
        {data && data.leaderboard && data.leaderboard.slice(0, 3).map(record =>
          <LeaderboardChip key={record.address} record={record} />
        )}
      </div>

      <table className="w-full mb-12 border-collapse border border-[#333333]">
        <thead>
          <tr>
            {['Ranking', 'Address', 'Ship name', 'Pilot name', 'Fuel', 'Distance'].map(header =>
              <th key={header} className="p-4 font-dmsans-regular text-[#FAFAFA] text-left border border-[#333333]">{header}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {getPageData().map(record =>
            <LeaderboardRow key={record.address} record={record} />
          )}
        </tbody>
      </table>

      <div className="flex flex-row justify-center items-center mb-12">
        <p className="flex-initial font-dmsans-regular text-[#848484] mr-8">
          {`Displaying ${offset+1}-${offset+PAGE_SIZE} of ${data && data.leaderboard ? data.leaderboard.length-3 : 0}`}
        </p>
        <button
          className={`flex-initial w-12 h-12 font-monocraft-regular text-black p-3 rounded-xl text-md mr-4 ${hasPrevPage() ? 'bg-[#07F3E6]' : 'bg-[#AFAFAF]'}`}
          onClick={prevPage}
        >
          {`<`}
        </button>
        <button
          className={`flex-initial w-12 h-12 font-monocraft-regular text-black p-3 rounded-xl text-md ${hasNextPage() ? 'bg-[#07F3E6]' : 'bg-[#AFAFAF]'}`}
          onClick={nextPage}
        >
          {`>`}
        </button>
      </div>

    </div>
  );
}
