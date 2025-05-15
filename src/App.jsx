import { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Button, Space, message } from 'antd';
import { FileTextOutlined, DashboardOutlined, BarChartOutlined, LogoutOutlined } from '@ant-design/icons';
import LoginForm from './components/LoginForm';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Statistics';
import Reports from './pages/Reports';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('LocalStorage error:', error);
      return null;
    }
  });

  const [selectedMenu, setSelectedMenu] = useState(() => {
    try {
      return localStorage.getItem('selectedMenu') || '1';
    } catch {
      return '1';
    }
  });

  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('selectedMenu', selectedMenu);
  }, [selectedMenu]);

  const handleLogin = (userData) => {
    try {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      message.success(`Hoş geldiniz, ${userData.ad}`);
    } catch (error) {
      console.error('Login error:', error);
      message.error('Giriş işlemi sırasında bir hata oluştu');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('selectedMenu');
      setUser(null);
      setSelectedMenu('1');
      message.success('Başarıyla çıkış yapıldı');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Çıkış işlemi sırasında bir hata oluştu');
    }
  };

  const menuItems = [
    { key: '1', icon: <DashboardOutlined />, label: 'İlaç İşlemleri' },
    { key: '3', icon: <BarChartOutlined />, label: 'İstatistikler' },
    { key: '4', icon: <FileTextOutlined />, label: 'Satışlar' } // Label updated
  ];

  const renderContent = () => {
    if (!user) {
      return <LoginForm onLogin={handleLogin} />;
    }

    switch (selectedMenu) {
      case '1':
        return <Dashboard user={user} onMedicinesChange={setMedicines} />;
      case '3':
        return <Statistics />;
      case '4':
        return <Reports medicines={medicines} />;
      default:
        return <Dashboard user={user} onMedicinesChange={setMedicines} />;
    }
  };

  if (!user) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px' }}>
          <LoginForm onLogin={handleLogin} />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#001529', 
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Title style={{ color: 'white', margin: '16px 0' }} level={3}>
          İlaç Takip Sistemi
        </Title>
        <Space>
          <Text style={{ color: 'white' }}>{user.ad}</Text>
          <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            style={{ color: 'white' }}
          >
            Çıkış Yap
          </Button>
        </Space>
      </Header>
      
      <Layout>
        <Sider width={200}>
          <Menu
            mode="inline"
            selectedKeys={[selectedMenu]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={e => setSelectedMenu(e.key)}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ 
            background: '#fff', 
            padding: 24, 
            margin: 0, 
            minHeight: 280,
            borderRadius: '4px'
          }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
