import React from "react";
import { Card, CardHeader } from "../ui/card";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const CommonDropdownCard = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => {
  return (
    <Card className="min-w-50 py-4 px-6 shadow-none relative gap-1">
      <CardHeader className="p-0">
        <div className="flex justify-between">
          <span className="font-medium ">{title}</span>
          <Select defaultValue={""}>
            <SelectTrigger id="form-rhf-demo-type">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <>{children}</>
    </Card>
  );
};

export default CommonDropdownCard;
