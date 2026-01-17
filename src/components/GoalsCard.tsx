import CommonProgress from "./common/CommonProgress";
import CommonUrlCard from "./common/CommonUrlCard";
import { Progress } from "./ui/progress";

const GoalsCard = () => {
  return (
    <div>
      <CommonUrlCard redirect="/" title="Saving goals">
        <div className="flex flex-col gap-6">
          <CommonProgress amount={45000} label="MacBook Pro" percentage={60} />
          <CommonProgress amount={3500} label="New cor" percentage={40} />
          <CommonProgress amount={900000} label="New house" percentage={10} />
        </div>
      </CommonUrlCard>
    </div>
  );
};

export default GoalsCard;
