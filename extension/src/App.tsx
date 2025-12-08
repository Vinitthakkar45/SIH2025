import React, { useState } from "react";
import { ChatWidget } from "./components/ChatWidget";
import { ChatToggleButton } from "./components/ChatToggleButton";

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ChatToggleButton onClick={() => setIsOpen(true)} isOpen={isOpen} />
      <ChatWidget isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default App;
