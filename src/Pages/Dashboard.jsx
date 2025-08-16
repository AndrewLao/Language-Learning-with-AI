import "./Dashboard.css"
import Card from "../Components/Card";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="cards-grid">
          <Card title="Card Title" value="10" unit="units" />
          <Card title="Card Title" value="10" unit="units" />
          <Card title="Card Title" value="10" unit="units" />
          <Card title="Card Title" value="10" unit="units" />
          <Card title="Card Title" value="10" unit="units" />
        </div>
      </div>
    </div>
  )
};

export default Dashboard;
