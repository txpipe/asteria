import { useState } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, gql } from '@apollo/client';
import { useChallengeStore, Challenge } from '@/stores/challenge';

const PAGE_SIZE = 10;

const GET_LEADERBOARD_PLAYERS_RECORDS = gql`
  query LeaderboardPlayers($spacetimePolicyId: String, $pelletPolicyId: String, $spacetimeAddress: String) {
    leaderboardPlayers(spacetimePolicyId: $spacetimePolicyId, pelletPolicyId: $pelletPolicyId, spacetimeAddress: $spacetimeAddress) {
      ranking,
      address,
      shipName,
      pilotName,
      fuel,
      distance
    }
  }
`;

const GET_LEADERBOARD_WINNERS_RECORDS = gql`
  query LeaderboardWinners($spacetimePolicyId: String, $pelletPolicyId: String, $spacetimeAddress: String) {
    leaderboardWinners(spacetimePolicyId: $spacetimePolicyId, pelletPolicyId: $pelletPolicyId, spacetimeAddress: $spacetimeAddress) {
      ranking,
      address,
      shipName,
      pilotName,
      fuel
    }
  }
`;

interface LeaderboardQueryResult {
  leaderboardPlayers: LeaderboardRecord[];
  leaderboardWinners: LeaderboardRecord[];
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
  leaderboard: boolean;
  challenge: Challenge;
  record: LeaderboardRecord;
}

const hexToAscii = (hex: string): string => {
  return Buffer.from(hex, 'hex').toString();
}

const getShipByAddress = (address: string): string => {
  const encoder = new TextEncoder();
  const charCode = encoder.encode(address.charAt(address.length-3))[0];
  return `/ships/ship_${Math.round(charCode%7)}.svg`;
}

const LeaderboardChip: React.FunctionComponent<RecordProps> = (props: RecordProps) => (
  <a href={`${props.challenge.explorerUrl}${props.record.address}`} target="_blank">
    <div className="flex-initial flex flex-row items-center mx-4 pl-8 pr-6 py-4 rounded-full bg-linear-to-r from-[#46434312] to-[#FFFFFF12]">
      <h1 className="flex-initial pb-1 mr-6 font-mono text-5xl text-[#07F3E6]">
        {props.record.ranking}
      </h1>
      <div className="flex-initial mr-6 p-4 rounded-full bg-[#FFFFFF08] border-b-[#333] border-b-solid border-b">
        <img className="w-8 h-8" src={getShipByAddress(props.record.address)} />
      </div>
      <p className="flex-initial mr-6 text-white">
        <span className="font-bold">Pilot: </span> {hexToAscii(props.record.pilotName)}<br/>
        <span className="font-bold">Ship: </span> {hexToAscii(props.record.shipName)}
      </p>
      <div className="flex-initial py-2 px-4 rounded-full bg-[#E7ECEF] text-[#171717]">
        {props.record.distance}
      </div>
    </div>
  </a>
);

const LeaderboardRow: React.FunctionComponent<RecordProps> = (props: RecordProps) => (
  <tr>
    <td className="p-4 text-[#07F3E6] text-left border border-[#333333]">
      {props.record.ranking}
    </td>
    <td className="p-4 text-[#D7D7D7] text-left border border-[#333333]">
      <img className="inline mr-4 w-8 h-8" src={getShipByAddress(props.record.address)} />
      <a
        className="text-[#07F3E6] underline"
        href={`${props.challenge.explorerUrl}${props.record.address}`}
        target="_blank"
      >
        {props.record.address}
      </a>
    </td>
    <td className="p-4 text-[#D7D7D7] text-left border border-[#333333]">
      {hexToAscii(props.record.pilotName)}
    </td>
    <td className="p-4 text-[#D7D7D7] text-left border border-[#333333]">
      {hexToAscii(props.record.shipName)}
    </td>
    <td className="p-4 text-[#D7D7D7] text-left border border-[#333333]">
      {props.record.fuel}
    </td>
    {props.leaderboard && (
      <td className="p-4 text-left border border-[#333333]">
        <span className="py-2 px-4 rounded-full bg-[#E7ECEF] font-dmsans-regular text-[#171717]">
          {props.record.distance}
        </span>
      </td>
    )}
  </tr>
);

export function Leaderboard() {
  const [ offset, setOffset ] = useState<number>(0);
  const [ leaderboard, setLeaderboard ] = useState<boolean>(true);

  const { current } = useChallengeStore();

  const { data } = useQuery<LeaderboardQueryResult>(leaderboard ? GET_LEADERBOARD_PLAYERS_RECORDS : GET_LEADERBOARD_WINNERS_RECORDS, {
    variables: {
      spacetimePolicyId: current().spacetimePolicyId,
      pelletPolicyId: current().pelletPolicyId,
      spacetimeAddress: current().spacetimeAddress,
    },
  });

  const hasNextPage = () => {
    if (leaderboard) {
      return data && data.leaderboardPlayers && offset + PAGE_SIZE < data.leaderboardPlayers.length;
    } else {
      return data && data.leaderboardWinners && offset + PAGE_SIZE < data.leaderboardWinners.length;
    }
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

  const getPagination = () => {
    if (leaderboard) {
      return `Displaying ${offset+1}-${offset+PAGE_SIZE} of ${data && data.leaderboardPlayers ? data.leaderboardPlayers.length : 0}`;
    } else {
      return `Displaying ${offset+1}-${offset+PAGE_SIZE} of ${data && data.leaderboardWinners ? data.leaderboardWinners.length : 0}`;
    }
  }

  const getPageData = () => {
    if (leaderboard) {
      if (!data || !data.leaderboardPlayers) return [];
      return data.leaderboardPlayers.slice(offset, offset+PAGE_SIZE);
    } else {
      if (!data || !data.leaderboardWinners) return [];
      return data.leaderboardWinners.slice(offset, offset+PAGE_SIZE);
    }
  }

  const getColumns = () => {
    if (leaderboard) {
      return ['Ranking', 'Address', 'Ship name', 'Pilot name', 'Fuel', 'Distance'];
    } else {
      return ['Ranking', 'Address', 'Ship name', 'Pilot name', 'Fuel'];
    }
  }

  return (
    <div className="container 2xl mx-auto p-8 min-h-[calc(100vh-64px)]">
      
      <div className="flex flex-row items-center mb-12">
        <h1 className="flex-auto mr-6 font-mono text-4xl text-[#FFF75D]">
          <span className="cursor-pointer" onClick={() => setLeaderboard(!leaderboard) }>
            {`ASTERIA ${ leaderboard ? 'PLAYERS' : 'WINNERS' } >`}
          </span>
        </h1>
        {/* <input
          type="text"
          placeholder="Type your ADDRESS / SHIP NAME"
          className="form-input flex-initial basis-2/5 mr-6 px-6 py-4 rounded-3xl bg-[#242424] border-transparent focus:border-[#919090] text-[#919090] focus:ring-0"
        />
        <button className="flex-initial font-mono text-black bg-[#07F3E6] py-4 px-8 rounded-full text-base">
          Find me
        </button> */}
      </div>

      {leaderboard && (
        <div className="flex flex-row justify-center items-center mb-12">
          {data && data.leaderboardPlayers && data.leaderboardPlayers.slice(0, 3).map(record =>
            <LeaderboardChip key={record.address} leaderboard={leaderboard} record={record} challenge={current()} />
          )}
        </div>
      )}

      <table className="w-full mb-12 border-collapse border border-[#333333]">
        <thead>
          <tr>
            {getColumns().map(header =>
              <th key={header} className="p-4 text-[#FAFAFA] text-left border border-[#333333]">{header}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {getPageData().map(record =>
            <LeaderboardRow key={record.address} leaderboard={leaderboard} record={record} challenge={current()} />
          )}
        </tbody>
      </table>

      <div className="flex flex-row justify-center items-center mb-12">
        <p className="flex-initial text-[#848484] mr-8">
          {getPagination()}
        </p>
        <button
          className={`flex-initial w-12 h-12 font-mono text-black p-3 rounded-xl text-base mr-4 ${hasPrevPage() ? 'bg-[#07F3E6]' : 'bg-[#AFAFAF]'}`}
          onClick={prevPage}
        >
          {`<`}
        </button>
        <button
          className={`flex-initial w-12 h-12 font-mono text-black p-3 rounded-xl text-base ${hasNextPage() ? 'bg-[#07F3E6]' : 'bg-[#AFAFAF]'}`}
          onClick={nextPage}
        >
          {`>`}
        </button>
      </div>

    </div>
  );
}

export default function LeaderboardWrapper() {
  const { current } = useChallengeStore();

  const apolloClient = new ApolloClient({
    uri: `${current().apiUrl}/graphql`,
    cache: new InMemoryCache(),
  });

  return (
    <ApolloProvider client={apolloClient}>
      <Leaderboard />
    </ApolloProvider>
  );
}