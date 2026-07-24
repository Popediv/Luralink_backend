function log(message, meta = {}) {
  console.log(JSON.stringify({ message, ...meta }));
}

export { log };
