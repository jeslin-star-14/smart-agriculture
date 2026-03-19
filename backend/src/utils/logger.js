const formatMessage = (message) => {
  return `[${new Date().toISOString()}] ${message}`;
};

const logger = {
  info: (message) => console.log(`ℹ️  ${formatMessage(message)}`),
  warn: (message) => console.warn(`⚠️  ${formatMessage(message)}`),
  error: (message) => console.error(`❌ ${formatMessage(message)}`),
  debug: (message) => console.log(`🐛 ${formatMessage(message)}`)
};

export default logger;