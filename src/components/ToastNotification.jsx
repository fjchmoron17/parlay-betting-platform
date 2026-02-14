import React from 'react';
import './ToastNotification.css';

export default function ToastNotification({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="toast-notification" onClick={onClose}>
      {message}
    </div>
  );
}
