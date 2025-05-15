import { Form, Input, Button, message } from 'antd';
import { fetchEmployees } from '../api/sheetsApi';

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
    <Form
      form={form}
      name="login"
      layout="vertical"
      onFinish={onFinish}
      style={{ maxWidth: 400, margin: 'auto', marginTop: '20vh' }}
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
  );
};

export default LoginForm;
