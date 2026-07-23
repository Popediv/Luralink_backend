class NotificationService {
  static send(_recipient, _message) {
    return { delivered: true };
  }
}

module.exports = NotificationService;
