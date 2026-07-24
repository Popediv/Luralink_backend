class NotificationService {
  static send(_recipient, _message) {
    return { delivered: true };
  }
}

export default NotificationService;
