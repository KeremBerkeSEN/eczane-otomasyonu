import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css';
import { ConfigProvider, App as AntdApp } from 'antd';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Root element with id 'root' not found. Check your index.html file.");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#ff4d4f', 
          colorLink: '#ff4d4f', 
          colorLinkHover: '#d9363e', 
          colorSuccess: '#52c41a', 
          colorWarning: '#faad14', 
          colorError: '#ff4d4f', 
        },
      }}
    >
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  );
}
