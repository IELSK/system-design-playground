import { SimulationResponse } from "../../types/simulation";
import SummaryCards from "./SummaryCards";
import LatencyChart from "./LatencyChart";
import UtilizationBars from "./UtilizationBars";
import NodeDetailTable from "./NodeDetailTable";

interface Props {
  result: SimulationResponse;
  onClose: () => void;
}

export default function Dashboard({ result, onClose }: Props) {
  return (
    <div className="w-full md:w-[40%] md:min-w-[320px] md:max-w-[480px] h-full bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-200">Performance Dashboard</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-5">
        <SummaryCards result={result} />
        <LatencyChart nodes={result.nodes} />
        <UtilizationBars nodes={result.nodes} />
        <NodeDetailTable nodes={result.nodes} />
      </div>
    </div>
  );
}
