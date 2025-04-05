// Configuration for Jest Puppeteer
module.exports = {
  launch: {
    headless: process.env.HEADLESS !== 'false', // Run in headless mode unless specified otherwise
    slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 0, // Slow down operations for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Recommended args for CI environments
    defaultViewport: {
      width: 1280,
      height: 720,
    },
  },
  server: {
    command: 'npm run dev',
    port: 5173, // The port your Vite app runs on
    launchTimeout: 60000, // Extra time for Vite to start
    debug: true,
  },
};
