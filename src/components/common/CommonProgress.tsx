import { Progress } from "../ui/progress";

const CommonProgress = ({
  label,
  amount,
  percentage,
}: {
  label: string;
  amount: number;
  percentage: number;
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-medium">{amount}</span>
      </div>

      <div className="relative w-full">
        <Progress value={percentage} className="h-7" />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
          {percentage}%
        </span>
      </div>
    </div>
  );
};

export default CommonProgress;
