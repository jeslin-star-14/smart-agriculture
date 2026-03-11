export default function StatusIndicator({ status }) {

  return (
    <div className="status-box">
      Device Status :
      <span className={status ? "online" : "offline"}>
        {status ? "Connected" : "Not Connected"}
      </span>
    </div>
  )
}