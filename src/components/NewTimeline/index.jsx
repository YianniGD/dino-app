// Fix: Add imports for React, ReactDOM, and the App component.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { jsx as _jsx } from "react/jsx-runtime";
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(/*#__PURE__*/_jsx(React.StrictMode, {
  children: /*#__PURE__*/_jsx(App, {})
}));