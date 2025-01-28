const io = require("socket.io-client");
jest.mock("../models/Channel");
const Channel = require("../models/Channel");

describe("/list WebSocket Route", () => {
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
  it("should emit the channelList event when /list is triggered", (done) => {
    const mockChannels = [{ name: "general" }, { name: "random" }];
    const Channel = require("../models/Channel");
    Channel.find.mockResolvedValue(mockChannels);
    clientSocket.on("channelList", (channels) => {
      try {
        expect(channels).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.emit("listChannels");
  });
});
