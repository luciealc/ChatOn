const io = require("socket.io-client");

describe("/nick WebSocket Route", () => {
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
  it("should set a nickname for a new user", (done) => {
    const testNickname = "testUser";
    clientSocket.on("nicknameSet", (nickname) => {
      try {
        expect(nickname).toBe(testNickname);
        done();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.emit("setNickname", testNickname);
  });
  it("should return an error if nickname cannot be set", (done) => {
    const invalidNickname = "";
    clientSocket.on("error", (message) => {
      try {
        expect(message).toBe("Could not set nickname");
        done();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.emit("setNickname", invalidNickname);
  });
});