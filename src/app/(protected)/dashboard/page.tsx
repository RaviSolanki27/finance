import ChartBarMultiple from "@/components/BarChart";
import ChartRadialStacked from "@/components/Chart";
import GoalsCard from "@/components/GoalsCard";
import StatsCard from "@/components/StatsCard";
import { DataTableDemo } from "@/components/TransactionTable";
import { Card } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-4 grid-cols-4">
        <StatsCard
          title="Total balance"
          amount={12000}
          matrixLabel="vs last month"
          percentage={12.21}
          redirect="/dashboard"
        />
        <StatsCard
          title="Total expenses"
          amount={-12070}
          matrixLabel="vs last month"
          percentage={-12.21}
          redirect="/expense"
        />
        <StatsCard
          title="Total income"
          amount={-12070}
          matrixLabel="vs last month"
          percentage={-12.21}
          redirect="/expense"
        />
        <StatsCard
          title="Total savings"
          amount={-12070}
          matrixLabel="vs last month"
          percentage={-12.21}
          redirect="/expense"
        />
      </div>

      <div className="grid gap-4 grid-cols-12">
        <div className="col-span-8 h-full">
          <ChartBarMultiple />
        </div>
        <div className="col-span-4 h-full">
          <ChartRadialStacked />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-12">
        <Card className="col-span-8 h-full py-4 px-6">
          <DataTableDemo />
        </Card>
        <div className="col-span-4 h-full">
          <GoalsCard />
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
