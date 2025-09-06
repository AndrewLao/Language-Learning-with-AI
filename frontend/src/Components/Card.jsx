import "./Card.css";

const Card = (props) => {
    return (
        <div className="card">
            <div className="card-center">
                <h2>{props.title}</h2>
                <div className="card-value-unit">
                    <span>{props.value}</span>
                    <span className="card-unit">{props.unit}</span>
                </div>
            </div>
        </div>
    );
};

export default Card;