class AuthController {
  static login(req, res) {
    res.status(200).json({ message: 'Auth controller placeholder' });
  }
}

module.exports = AuthController;
