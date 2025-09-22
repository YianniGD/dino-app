import React from 'react';

const DiggingGameHost = () => {
  return (
    <iframe
      src={process.env.PUBLIC_URL + '/digging-game-host.html'}
      title="Digging Game"
      width="100%"
      height="100%"
      style={{ border: 'none' }}
    ></iframe>
  );
};

export default DiggingGameHost;