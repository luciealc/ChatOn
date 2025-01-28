const io = require('socket.io-client');
const Channel = require("../models/Channel");

describe('/sendMessage WebSocket Route', () => {
  let clientSocket, anotherClientSocket;
  beforeEach((done) => {
    clientSocket = io('http://localhost:3003');
    anotherClientSocket = io('http://localhost:3003');
    let connections = 0;
    const checkConnections = () => {
      connections++;
      if (connections === 2) done();
    };
    clientSocket.on('connect', checkConnections);
    anotherClientSocket.on('connect', checkConnections);
  });
  afterEach(() => {
    if (clientSocket.connected) clientSocket.disconnect();
    if (anotherClientSocket.connected) anotherClientSocket.disconnect();
  });
  it('should return an error if the channel does not exist', (done) => {
    const channelName = 'chennell';
    const message = 'Hello!';
    Channel.findOne = jest.fn().mockResolvedValue(null);
    clientSocket.on('error', (errorMessage) => {
      try {
        expect(errorMessage).toBe(`Channel "${channelName}" not found`);
        done();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.emit('sendMessage', { channelName, message });
  });
});