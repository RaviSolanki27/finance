import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { ArrowRight, ArrowUp, ArrowUpRight } from "lucide-react";
import { Button } from "../ui/button";

const CommonAccountCard = ({
  children,
  totalBalance,
  category,
  total = 1,
  percentage = 12,
}: {
  children: React.ReactNode;
  totalBalance: number;
  category?: string;
  total: number;
  percentage: number;
}) => {
  return (
    <Card className="min-w-50 py-4 px-6 shadow-none relative gap-3">
      <CardHeader className="p-0">
        <div className="flex justify-between">
          {/* <span className="font-medium text-2xl ">${totalBalance}.00</span> */}
          <span className="font-medium ">🏦 Bank accounts</span>
          <Badge variant={"outline"}>Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col">
          <span className="font-medium text-2xl">${totalBalance}.00</span>
          <span className="flex  gap-2">
            <Badge variant="success" className="">
              <ArrowUp /> {percentage >= 0 ? `+${percentage}` : `${percentage}`}
              %
            </Badge>
            <span className="text-muted-foreground text-sm">
              {" "}
              vs last month
            </span>
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-0 justify-between items-end">
        <div className="text-xs">Last activity: Today</div>
        <Button size={"sm"} variant={"secondary"}>
          See all accounts <ArrowRight />
        </Button>
      </CardFooter>
      {/* <>{children}</> */}
    </Card>
  );
};

export default CommonAccountCard;
