const io = require("socket.io-client");

describe("/users WebSocket Route", () => {
  let clientSocket;
  beforeEach((done) => {
    clientSocket = io("http://localhost:3003");
    clientSocket.on("connect", done);
  });
  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });
  it("should emit the userList event when /users is triggered", (done) => {
    const channelName = "channel1";
    clientSocket.on("userList", (data) => {
      try {
        expect(data).toBeDefined();
        expect(data.channel).toBe(channelName);
        expect(Array.isArray(data.users)).toBe(true);
        expect(data.users.length).toBeGreaterThan(0);
        done();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.emit("listUsers", channelName);
  });
  it("should return an error if channel is not found", (done) => {
    const nonExistentChannel = "nonexistent-channel";
    clientSocket.on("error", (message) => {
      try {
        expect(message).toBe(`Channel "${nonExistentChannel}" not found`);
        done();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.emit("listUsers", nonExistentChannel);
  });
});
