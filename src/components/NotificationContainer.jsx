import { useApp } from '../context/AppContext';
import Notification from './Notification';
import './Notification.css';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useApp();

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;

