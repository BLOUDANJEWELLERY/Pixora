// serverKeepAlive.js
class ServerKeepAlive {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.intervalId = null;
    this.isActive = false;
  }

  start() {
    if (this.isActive) return;

    console.log('Starting server keep-alive service...');
    this.isActive = true;

    // Initial ping
    this.pingServer();

    // Set up interval for regular pings
    this.intervalId = setInterval(() => {
      this.pingServer();
    }, 4 * 60 * 1000); // Every 4 minutes
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
    console.log('Server keep-alive service stopped');
  }

  async pingServer() {
    try {
      await fetch(this.serverUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      console.log('Server ping successful');
    } catch (error) {
      console.log('Server ping failed (may be starting up)');
    }
  }
}

// Create instance for your server
const civilIdServerKeepAlive = new ServerKeepAlive('https://civil-id-server.onrender.com/');

export default civilIdServerKeepAlive;