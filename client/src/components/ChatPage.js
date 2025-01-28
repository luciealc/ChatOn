

import React, { useState, useRef, useEffect, useContext } from 'react';
import { NicknameContext } from '../context/NicknameContext'; // Assurez-vous que le chemin est correct

import io from 'socket.io-client';

// Liste de toutes les commandes possibles
const COMMANDS = [
  { cmd: "/nick", desc: "Change your nickname" },
  { cmd: "/list", desc: "List all channels" },
  { cmd: "/create", desc: "Create a new channel" },
  { cmd: "/delete", desc: "Delete a channel" },
  { cmd: "/join", desc: "Join a channel" },
  { cmd: "/quit", desc: "Quit a channel" },
  { cmd: "/users", desc: "List users in a channel" },
  { cmd: "/msg", desc: "Send a private message" },  
];

// Par défaut, le serveur est sur localhost:3003
const socket = io(process.env.REACT_APP_SERVER_URL || "https://chaton-s8rx.onrender.com");

function ChatPage() {
  // States IRC
  const { nickname, setNickname } = useContext(NicknameContext);
  const [channels, setChannels] = useState([]);
  const [joinedChannels, setJoinedChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState("");
  const [messagesByChannel, setMessagesByChannel] = useState({});
  const messagesEndRef = useRef(null);

  // States auto-complétion
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState([]);

  const handleChangeNickname = (newNickname) => {
    setNickname(newNickname);
    // Émettez l'événement pour changer le pseudonyme sur le serveur
    socket.emit('setNickname', newNickname);
  };

  useEffect(() => {
    // Socket events
    socket.on("connect", () => {
      console.log("Connected =>", socket.id);
    });

    socket.on("nicknameSet", (nick) => {
      setNickname(nick);
    });

    socket.on("channelList", (channelNames) => {
      setChannels(channelNames);
    });

    socket.on("channelCreated", (channelName) => {
      setChannels((prev) => [...prev, channelName]);
      addSystemMessage(channelName, `Channel "${channelName}" created.`);
    });

    socket.on("channelDeleted", (channelName) => {
      setChannels((prev) => prev.filter((c) => c !== channelName));
      setJoinedChannels((prev) => prev.filter((c) => c !== channelName));
      if (activeChannel === channelName) {
        setActiveChannel("");
      }
      addSystemMessage(channelName, `Channel "${channelName}" deleted.`);
    });

    socket.on("userJoined", (nick) => {
      if (activeChannel) {
        addSystemMessage(activeChannel, `${nick} joined the channel`);
      }
    });

    socket.on("userLeft", (nick) => {
      if (activeChannel) {
        addSystemMessage(activeChannel, `${nick} left the channel`);
      }
    });

    socket.on("message", (data) => {
      addMessage(activeChannel, data.user, data.message);
    });

    socket.on("privateMessage", ({ from, message }) => {
      addSystemMessage(activeChannel, `(PM) from ${from}: ${message}`);
    });

    socket.on("error", (err) => {
      addSystemMessage(activeChannel, `Error: ${err}`);
    });

    return () => {
      socket.off("connect");
      socket.off("nicknameSet");
      socket.off("channelList");
      socket.off("channelCreated");
      socket.off("channelDeleted");
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("message");
      socket.off("privateMessage");
      socket.off("error");
    };
  }, [activeChannel]);

  useEffect(() => {
    socket.on("userList", ({ channel, users }) => {
      const msg = `Users in ${channel}: ${users.join(", ")}`;
      addSystemMessage(channel, msg);
    });
    return () => {
      socket.off("userList");
    };
  }, []);

  const addMessage = (channel, user, message) => {
    if (!channel) return;
    setMessagesByChannel((prev) => ({
      ...prev,
      [channel]: [...(prev[channel] || []), { user, message }],
    }));
  };

  const addSystemMessage = (channel, text) => {
    if (!channel) return;
    addMessage(channel, "SYSTEM", text);
  };

  const handleCommand = (input) => {
    const [cmd, ...args] = input.trim().split(/\s+/);
    if (!cmd) return;
    switch (cmd.toLowerCase()) {
      case "/nick":
        if (!args[0]) {
          addSystemMessage(activeChannel, "Usage: /nick <nickname>");
          return;
        }
        socket.emit("setNickname", args[0]);
        setNickname(args[0]);
        break;
      case "/list":
        socket.emit("listChannels");
        break;
      case "/create":
        if (!args[0]) {
          addSystemMessage(activeChannel, "Usage: /create <channelName>");
          return;
        }
        socket.emit("createChannel", args[0]);
        break;
      case "/delete":
        if (!args[0]) {
          addSystemMessage(activeChannel, "Usage: /delete <channelName>");
          return;
        }
        socket.emit("deleteChannel", args[0]);
        break;
      case "/join":
        if (!args[0]) {
          addSystemMessage(activeChannel, "Usage: /join <channelName>");
          return;
        }
        const chan = args[0];
        socket.emit("joinChannel", chan);
        if (!joinedChannels.includes(chan)) {
          setJoinedChannels((prev) => [...prev, chan]);
        }
        setChannels((prev) => prev.filter((c) => c !== chan));
        setActiveChannel(chan);
        setMessagesByChannel((prev) => ({
          ...prev,
          [chan]: prev[chan] || [],
        }));
        break;
      case "/quit":
        {
          const ch = args[0] || activeChannel;
          if (!ch) {
            addSystemMessage(activeChannel, "Usage: /quit <channelName>");
            return;
          }
          socket.emit("quitChannel", ch);
          setJoinedChannels((prev) => prev.filter((c) => c !== ch));
          if (activeChannel === ch) {
            setActiveChannel("");
          }
        }
        break;
      case "/users":
        {
          const c = args[0] || activeChannel;
          if (!c) {
            addSystemMessage(activeChannel, "Usage: /users <channelName>");
            return;
          }
          socket.emit("listUsers", c);
        }
        break;
      case "/msg":
        if (args.length < 2) {
          addSystemMessage(activeChannel, "Usage: /msg <nickname> <message>");
          return;
        }
        const [dest, ...rest] = args;
        socket.emit("privateMessage", {
          toNickname: dest,
          message: rest.join(" "),
        });
        break;
      default:
        if (cmd.startsWith("/")) {
          addSystemMessage(activeChannel, `Unknown command: ${cmd}`);
        } else {
          if (!activeChannel) {
            addSystemMessage(
              activeChannel,
              "Join a channel first (/join <channel>)"
            );
            return;
          }
          const msg = [cmd, ...args].join(" ");
          socket.emit("sendMessage", {
            channelName: activeChannel,
            message: msg,
          });
        }
        break;
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (val.startsWith("/")) {
      setShowSuggestions(true);
      const filtered = COMMANDS.filter((item) =>
        item.cmd.toLowerCase().startsWith(val.toLowerCase())
      );
      setFilteredCommands(filtered);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSubmitInput = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    handleCommand(trimmed);
    setInputValue("");
    setShowSuggestions(false);
  };

  const handleSelectCommand = (commandStr) => {
    setInputValue(commandStr + " ");
    setShowSuggestions(false);
  };

  const handleCreateChannel = () => {
    const channelName = prompt("Enter the name of the new channel:");
    if (channelName) {
      handleCommand(`/create ${channelName}`);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    socket.on('loadMessages', (messages) => {
      setMessagesByChannel((prev) => ({
        ...prev,
        [activeChannel]: messages
      }));
    });
    return () => {
      socket.off('loadMessages');
    };
  }, [activeChannel]);

  useEffect(() => {
    socket.on('connect', () => {
      addSystemMessage('Connected to server');
    });

    socket.on('disconnect', () => {
      addSystemMessage('Disconnected from server');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [addSystemMessage]);

  useEffect(() => {
    socket.on('loadMessages', (messages) => {
      setMessagesByChannel((prev) => ({
        ...prev,
        [activeChannel]: messages
      }));
    });
    return () => {
      socket.off('loadMessages');
    };
  }, [activeChannel]);

  const currentMessages = messagesByChannel[activeChannel] || [];

  useEffect(() => {
    if (currentMessages.length > 0) {
      scrollToBottom();
    }
  }, [currentMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messagesByChannel[activeChannel]]);

  return (

    <div className="flex h-screen">
      {/* Navbar latérale */}
      <aside className="w-1/4 bg-white border-r shadow-lg p-4 flex flex-col">
        <div className="mb-4 flex items-center justify-start">
          <img src="/2.png" alt="Logo" className="w-24 h-24" />
          <span className="ml-4 text-4xl font-bold">ChatOn</span>
        </div>
        <div>
          <button
            onClick={handleCreateChannel}
            className="mb-4 px-4 py-2 bg-[#5661F6] text-white rounded-lg hover:bg-[#5661F6] hover:text-white"
          >
            Create Channel
          </button>
          <h2 className="text-xl font-bold">Channels</h2>
          <ul className="mt-4 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {channels.map((ch) => (
              <li
                key={ch}
                onClick={() => handleCommand(`/join ${ch}`)}
                className={`cursor-pointer px-4 py-2 rounded-lg hover:bg-[#5661F6] hover:bg-opacity-20 hover:text-[#000000] ${ch === activeChannel ? "bg-[#5661F6] text-white" : ""
                  }`}
              >
                {ch}
              </li>
            ))}
          </ul>
          <h2 className="text-xl font-bold mt-4">Joined Channels</h2>
          <ul className="mt-4 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {joinedChannels.map((ch) => (
              <li
                key={ch}
                onClick={() => handleCommand(`/join ${ch}`)}
                className={`cursor-pointer px-4 py-2 rounded-lg hover:bg-[#5661F6] hover:bg-opacity-20 hover:text-[#000000] ${ch === activeChannel ? "bg-[#5661F6] text-white" : ""
                  }`}
              >
                {ch}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto pt-4 border-t">
          <span className="font-bold">Nickname: </span>
          <span>{nickname || "(none)"}</span>
        </div>
        
      </aside>

      {/* Zone de chat principale */}
      <main className="flex-1 flex flex-col bg-[url('/src/assets/cat-pattern.png')] bg-cover bg-center">
        <header className="p-4 bg-white border-b shadow">
          <h1 className="text-xl font-bold">
            Active Channel: {activeChannel || "(None)"}
          </h1>
        </header>
        <div className="flex-1 p-4 overflow-y-auto ">
          {(messagesByChannel[activeChannel] || []).map((msg, index) => (
            <div
              key={index}
              className={`mb-2 p-2 max-w-xs rounded-lg ${msg.user === "SYSTEM"
                ? "bg-yellow-400 text-black"
                : msg.user === nickname
                  ? "bg-[#5661F6] text-white"
                  : "bg-gray-300 text-black"
                }`}
            >
              <strong>{msg.user}: </strong>
              {msg.message}
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>
        <footer className="p-4 mt-auto bg-opacity-0">
          <div className="relative mb-4 mt-auto p-2 flex items-center justify-start">
            <input
              type="text"
              className="border p-2 w-full"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmitInput();
                }
              }}
              placeholder="Type a command or message..."
            />
            <button
              onClick={handleSubmitInput}
              className="ml-2 px-4 py-2 bg-[#5661F6] text-white rounded-lg hover:bg-[#5661F6] hover:text-white"
            >
              Send
            </button>
            {showSuggestions && filteredCommands.length > 0 && (
              <ul className="absolute bg-white border bottom-full mb-1 w-full z-10">
                {filteredCommands.map((item) => (
                  <li
                    key={item.cmd}
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectCommand(item.cmd)}
                  >
                    <span className="font-semibold">{item.cmd}</span> -{" "}
                    {item.desc}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}

export default ChatPage;