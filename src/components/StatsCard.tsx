import { CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { IStatsCard } from "@/utils";
import CommonUrlCard from "./common/CommonUrlCard";

const StatsCard = ({
  amount = 0,
  matrixLabel = "vs last month",
  percentage = 0,
  title = "Total amount",
  redirect = "/dashboard",
}: IStatsCard) => {
  return (
    <CommonUrlCard redirect={redirect} title={title}>
      <CardContent className="p-0 flex flex-col gap-4">
        <span className="text-2xl font-semibold">{amount}</span>
        <div className="flex gap-2">
          <Badge variant="success" className="">
            {percentage >= 0 ? `+${percentage}` : `${percentage}`}%
          </Badge>
          <span className="text-sm text-muted-foreground">{matrixLabel}</span>
        </div>
      </CardContent>
    </CommonUrlCard>
  );
};

export default StatsCard;
