import CommonDropdownCard from "@/components/common/CommonDropdownCard";

const Accounts = () => {
  return (
    <div>
      <div className="grid">
        <CommonDropdownCard title="Total balance">
          <div className="flex flex-col">
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
      </div>

      <div></div>
    </div>
  );
};

export default Accounts;
