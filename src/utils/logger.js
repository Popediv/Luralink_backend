function log(message, meta = {}) {
  console.log(JSON.stringify({ message, ...meta }));
}

module.exports = { log };
