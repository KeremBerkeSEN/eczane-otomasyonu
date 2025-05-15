import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Root element with id 'root' not found. Check your index.html file.");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
