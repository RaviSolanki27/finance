import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";

type CommonAccountCardProps = {
  totalBalance: number;
  category?: string;
  total?: number;
  percentage?: number;
};

const CommonAccountCard = ({
  totalBalance,
  category = "Bank accounts",
  total = 1,
  percentage = 12,
}: CommonAccountCardProps) => {
  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(totalBalance);

  const isGrowth = percentage >= 0;

  return (
    <Card className="relative min-w-50 gap-3 px-6 py-4 shadow-none">
      <CardHeader className="p-0">
        <div className="flex justify-between">
          <span className="font-medium">{category}</span>
          <Badge variant="outline">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col">
          <span className="text-2xl font-medium">{formattedBalance}</span>
          <span className="flex gap-2">
            <Badge variant={isGrowth ? "success" : "destructive"}>
              {isGrowth ? <ArrowUp /> : <ArrowDown />}
              {isGrowth ? `+${percentage}` : `${percentage}`}%
            </Badge>
            <span className="text-sm text-muted-foreground">vs last month</span>
          </span>
        </div>
      </CardContent>
      <CardFooter className="items-end justify-between p-0">
        <div className="text-xs">{total} account(s)</div>
        <Button size="sm" variant="secondary">
          See all accounts <ArrowRight />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CommonAccountCard;
