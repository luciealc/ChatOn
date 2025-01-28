function handleCommand(command, socket) {
  const [cmd, ...args] = command.trim().split(/\s+/);
  if (!cmd) return;

  switch (cmd.toLowerCase()) {
    case '/nick':
      if (!args[0]) {
        console.log('Usage: /nick <nickname>');
        return;
      }
      socket.emit('setNickname', args[0]);
      break;
    // ...
    default:
      console.log(`Unknown command: ${cmd}`);
  }
}

export default handleCommand;
