import React from "react";
import { Card, CardHeader } from "../ui/card";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const CommonUrlCard = ({
  children,
  redirect,
  title,
}: {
  children: React.ReactNode;
  redirect: string;
  title?: string;
}) => {
  return (
    <Card className="min-w-50 py-4 px-6 shadow-none relative">
      <Link
        href={redirect}
        className="group border absolute top-1 right-1 p-1.5 rounded-lg cursor-pointer hover:shadow-sm"
      >
        <ArrowUpRight className="group-hover:rotate-25 group-hover:scale-110  transition-all duration-200" />
      </Link>
      {title && (
        <CardHeader className="p-0">
          <span className="font-medium ">{title}</span>
        </CardHeader>
      )}
      <>{children}</>
    </Card>
  );
};

export default CommonUrlCard;
