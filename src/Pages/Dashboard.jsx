import "./Dashboard.css"
import Card from "../Components/Card";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="cards-grid">
          <Card title="Words Learned" value="1,250" unit="words" />
          <Card title="Lessons Completed" value="42" unit="lessons" />
          <Card title="Streak" value="15" unit="days" />
          <Card title="Words Written" value="1020" unit="words" />
          <Card title="Total Practice Time" value="36" unit="hours" />
        </div>
      </div>
    </div>
  )
};

export default Dashboard;
