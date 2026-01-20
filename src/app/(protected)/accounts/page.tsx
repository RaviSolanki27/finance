import CommonAccountCard from "@/components/common/CommonAccountCard";
import CommonDropdownCard from "@/components/common/CommonDropdownCard";

const Accounts = () => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
        <CommonDropdownCard title="Total balance">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <span className="text-3xl">$10,200.00</span>
              <span className="text-muted-foreground">
                Your capital consists of 3 sources
              </span>
            </div>

            <div className="flex gap-4">
              <button>Transfer</button>
              <button>Request</button>
              <button>...</button>
            </div>
          </div>
        </CommonDropdownCard>

        <CommonAccountCard
          total={5}
          totalBalance={12000}
          category="BANK"
          percentage={12}
        >
          Hello
        </CommonAccountCard>
      </div>

      <div></div>
    </div>
  );
};

export default Accounts;
