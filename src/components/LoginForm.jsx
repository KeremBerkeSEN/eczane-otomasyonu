import { Form, Input, Button, message } from 'antd';
import { fetchEmployees } from '../api/sheetsApi';
import loginLogo from '../assets/login-logo.png'; // Yeni logoyu import et

const LoginForm = ({ onLogin }) => {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      const employees = await fetchEmployees();
      const userByEmail = employees.find(emp => emp.email === values.email);

      if (!userByEmail) {
        message.error('E-posta adresi bulunamadı');
        return;
      }

      if (userByEmail.sifre !== values.sifre) {
        form.setFields([
          {
            name: 'sifre',
            errors: ['Girdiğiniz şifre eksik veya hatalı.']
          }
        ]);
        return;
      }

      message.success(`Hoş geldiniz, ${userByEmail.ad}`);
      onLogin(userByEmail);

    } catch (error) {
      console.error(error);
      message.error('Giriş yapılırken bir hata oluştu');
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#001529',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '400px',
        padding: '20px'
      }}>
        <img 
          src={loginLogo} 
          alt="Login Logo" 
          style={{ width: '300px', marginBottom: '30px' }} // Logo boyutu 200px'den 300px'e çıkarıldı
        />
        <Form
          form={form}
          name="login"
          layout="vertical"
          onFinish={onFinish}
          style={{ 
            width: '100%',
            padding: '30px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Email giriniz' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="sifre"
            label="Şifre"
            rules={[{ required: true, message: 'Şifre giriniz' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Giriş Yap
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginForm;
