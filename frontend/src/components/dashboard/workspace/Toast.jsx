// frontend/src/components/dashboard/v5/Toast.jsx
export default function Toast({ msg, show }) {
  return (
    <div className={`ukl-toast${show ? ' show' : ''}`}>
      {msg}
    </div>
  );
}
