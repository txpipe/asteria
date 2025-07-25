import { useEffect, useState } from 'react';
import { useChallengeStore } from '@/stores/challenge';
import { AsteriaMap } from '@/components/AsteriaMap';
import { LinkIcon } from '@/components/icons/LinkIcon';
import { CloseIcon } from '@/components/icons/CloseIcon';
import CodeBlock from '@/components/CodeBlock';

import type { Challenge } from '@/stores/challenge';

interface AssetsTableProps {
  challenge: Challenge;
  payload: any;
}

const hexToAscii = (hex: string): string => {
  return Buffer.from(hex, 'hex').toString();
}

const AssetsTable: React.FC<AssetsTableProps> = ({ payload, challenge }) => {
  return (
    <table className="w-full table-fixed border-collapse mt-4 border border-[#F1E9D9]/15 font-dmsans-regular text-md text-[#A0A0A0]">
      <thead>
        <tr>
          <th className="border border-[#F1E9D9]/15 p-2 text-left">Policy</th>
          <th className="border border-[#F1E9D9]/15 p-2 text-left">Token</th>
          <th className="border border-[#F1E9D9]/15 p-2 text-left">Value</th>
        </tr>
      </thead>
      <tbody>
        {payload.type == 'ship' &&
          <>
            <tr>
              <td className="border border-[#F1E9D9]/15 p-2 whitespace-nowrap text-ellipsis overflow-hidden">{challenge.fuelPolicyId}</td>
              <td className="border border-[#F1E9D9]/15 p-2">Fuel</td>
              <td className="border border-[#F1E9D9]/15 p-2 text-right">{payload.fuel}</td>
            </tr>
            <tr>
              <td className="border border-[#F1E9D9]/15 p-2 whitespace-nowrap text-ellipsis overflow-hidden">{challenge.shipyardPolicyId}</td>
              <td className="border border-[#F1E9D9]/15 p-2">{hexToAscii(payload.pilotTokenName)}</td>
              <td className="border border-[#F1E9D9]/15 p-2 text-right">1</td>
            </tr>
            <tr>
              <td className="border border-[#F1E9D9]/15 p-2 whitespace-nowrap text-ellipsis overflow-hidden">{challenge.shipyardPolicyId}</td>
              <td className="border border-[#F1E9D9]/15 p-2">{hexToAscii(payload.shipTokenName)}</td>
              <td className="border border-[#F1E9D9]/15 p-2 text-right">1</td>
            </tr>
          </>
        }
        {payload.type == 'token' &&
          <tr>
            <td className="border border-[#F1E9D9]/15 p-2 whitespace-nowrap text-ellipsis overflow-hidden">{challenge.fuelPolicyId}</td>
            <td className="border border-[#F1E9D9]/15 p-2">{payload.name}</td>
            <td className="border border-[#F1E9D9]/15 p-2 text-right">{payload.amount}</td>
          </tr>
        }
      </tbody>
    </table>
  );
};

export default function Explorer() {
  const { current } = useChallengeStore();
  const [payload, setPayload] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('message', (event) => {
      if (event.data.action == 'map_click' && event.data.payload) {
        setPayload(event.data.payload);
      }
    });
  }, []);

  return (
    <div className="w-full h-[calc(100vh-64px)]">
      <AsteriaMap
        mode="map"
        challenge={current()}
        className="fixed top-[64px] right-0 w-dvw h-[calc(100dvh-64px)]"
      />

      {payload && 
        <div className="fixed w-[30dvw] h-[calc(100dvh-64px)] left-0 top-[64px] py-12 pl-12">
          <div className="p-4 w-full h-full bg-[#0A0A0A]/80 rounded-[20px] border border-[#07F3E6] flex flex-col">
            <div className="p-4 mb-4 flex-0 flex flex-row ">
              <h2 className="flex-1 font-monocraft-regular text-xl text-white">
                {payload.type.toLocaleUpperCase()}
              </h2>
              <span className="flex-0 cursor-pointer" onClick={() => setPayload(null)}>
                <CloseIcon className="h-[24px] w-[24px]" />
              </span>
            </div>
            <div className="p-4 flex-1 bg-[#131313] rounded-[10px] overflow-y-scroll overflow-x-hidden">
              <div className="text-right">
                <a href={`${current().explorerUrl}${payload.tx}`} target="_blank" className="font-dmsans-regular text-lg text-[#A0A0A0] hover:text-[#07F3E6B2]">
                  <LinkIcon className="inline-block mr-2 h-[24px] w-[24px] mt-[-4px]" />
                  <span>View on public explorer</span>
                </a>
              </div>
              
              <p className="font-dmsans-regular text-lg text-[#07F3E6B2]">Tx</p>
              <p className="font-dmsans-regular text-lg text-[#A0A0A0] whitespace-pre-wrap break-words">{payload.tx}</p>
              
              <hr className="my-4 border-t-[#F1E9D9]/15" />
              
              <p className="font-dmsans-regular text-lg text-[#07F3E6B2]">Datum</p>
              <div className="bg-[#1E1E1E] mt-2 p-4 text-sm overflow-x-scroll">
                <CodeBlock lang="json" content={JSON.stringify(JSON.parse(payload.datum), null, 2)} />
              </div>
              
              <hr className="my-4 border-t-[#F1E9D9]/15" />
              
              <p className="font-dmsans-regular text-lg text-[#07F3E6B2]">Assets</p>
              <AssetsTable payload={payload} challenge={current()} />
            </div>
          </div>
        </div>
      }
    </div>
  );
}
