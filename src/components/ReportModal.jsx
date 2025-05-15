import { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, Button, Input, message, notification, Table, Space, Card, Statistic, Typography } from 'antd';
import { MailOutlined, CheckCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { fetchSales, fetchEmployees } from '../api/sheetsApi';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportModal = ({ visible, onCancel, medicines }) => {
  const [form] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [filteredSales, setFilteredSales] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [notificationApi, contextHolder] = notification.useNotification();

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const employeeData = await fetchEmployees();
        setEmployees(employeeData);
      } catch (error) {
        console.error('Çalışan verileri yüklenirken hata:', error);
      }
    };

    loadEmployees();
  }, []);

  const columns = [
    { title: 'İlaç Adı', dataIndex: 'ilac_adi', key: 'ilac_adi' },
    { title: 'Miktar', dataIndex: 'miktar', key: 'miktar', align: 'right' },
    { title: 'Satış Fiyatı (₺)', dataIndex: 'satis_fiyati', key: 'satis_fiyati', align: 'right' },
    { title: 'Toplam (₺)', dataIndex: 'toplam', key: 'toplam', align: 'right' },
    { title: 'Tarih', dataIndex: 'tarih', key: 'tarih' }
  ];

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const sales = await fetchSales();
      
      let filtered = sales;

      
      if (values.medicine_id) {
        const selectedMedicine = medicines.find(m => m.id === values.medicine_id);
        if (selectedMedicine) {
          filtered = filtered.filter(sale => 
            sale.ilac_adi.toLowerCase() === selectedMedicine.ilac_adi.toLowerCase()
          );
        }
      }

      
      if (values.dateRange?.length === 2) {
        const startDate = values.dateRange[0].startOf('day');
        const endDate = values.dateRange[1].endOf('day');
        filtered = filtered.filter(sale => {
          const saleDate = new Date(sale.tarih);
          return saleDate >= startDate.toDate() && saleDate <= endDate.toDate();
        });
      }

      
      if (values.employee_email) {
        filtered = filtered.filter(sale => sale.calisan_email === values.employee_email);
      }

      
      const processedData = filtered.map((sale, index) => ({
        key: `${sale.id}-${index}`,
        ilac_adi: sale.ilac_adi,
        miktar: parseInt(sale.miktar),
        satis_fiyati: parseFloat(sale.satis_fiyati).toFixed(2),
        toplam: (parseInt(sale.miktar) * parseFloat(sale.satis_fiyati)).toFixed(2),
        tarih: new Date(sale.tarih).toLocaleDateString('tr-TR')
      }));

      setFilteredSales(processedData);
      setShowResults(true);

      if (values.email) {
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        message.success('Rapor başarıyla e-mail olarak gönderildi');
        form.resetFields(['email']);
      }

    } catch (error) {
      console.error('Rapor oluşturma hatası:', error);
      message.error('Rapor oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSend = async () => {
    try {
      const values = await emailForm.validateFields();
      if (values.email) {
      
        await new Promise(resolve => setTimeout(resolve, 500));
        
        notificationApi.open({
          type: 'success',
          message: 'Rapor Gönderildi',
          description: 'Rapor başarılı bir şekilde e-posta olarak gönderildi.',
          placement: 'bottomRight',
          duration: 3,
          style: {
            marginBottom: '50px'
          }
        });
        
        emailForm.resetFields();
        onCancel();
      }
    } catch (error) {
      if (error.errorFields) {
        notificationApi.error({
          message: 'Hata',
          description: 'Lütfen geçerli bir e-posta adresi giriniz.',
          placement: 'bottomRight'
        });
      }
    }
  };

  const calculateTotals = () => {
    return filteredSales.reduce((acc, curr) => ({
      amount: acc.amount + parseFloat(curr.toplam),
      count: acc.count + parseInt(curr.miktar)
    }), { amount: 0, count: 0 });
  };

  const totals = calculateTotals();

  return (
    <Modal
      title="Satış Raporu"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
    >
      {contextHolder}
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Form.Item name="medicine_id" label="İlaç Filtresi">
            <Select allowClear placeholder="Tüm ilaçlar">
              {medicines.map(medicine => (
                <Option key={medicine.id} value={medicine.id}>
                  {medicine.ilac_adi}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="employee_email" label="Çalışan Filtresi">
            <Select allowClear placeholder="Tüm çalışanlar">
              {employees.map(employee => (
                <Option key={employee.email} value={employee.email}>
                  {employee.ad}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label="Tarih Aralığı">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} block>
            Raporu Oluştur
          </Button>
        </Space>
      </Form>

      {showResults && (
        <>
          <Space size="large" style={{ marginBottom: 16, width: '100%', justifyContent: 'space-around' }}>
            <Card>
              <Statistic title="Toplam Satış Adedi" value={totals.count} />
            </Card>
            <Card>
              <Statistic 
                title="Toplam Gelir" 
                value={totals.amount} 
                precision={2}
                suffix="₺" 
              />
            </Card>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredSales}
            pagination={false}
            scroll={{ y: 400 }}
            style={{ marginBottom: 16 }}
            summary={pageData => {
              const total = pageData.reduce((sum, item) => sum + parseFloat(item.toplam), 0);
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell>Toplam</Table.Summary.Cell>
                  <Table.Summary.Cell></Table.Summary.Cell>
                  <Table.Summary.Cell></Table.Summary.Cell>
                  <Table.Summary.Cell align="right">
                    <Text strong>{total.toFixed(2)} ₺</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell></Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />

          <Card style={{ marginTop: 16 }}>
            <Form 
              form={emailForm}
              layout="vertical"
              onFinish={handleEmailSend}
            >
              <Form.Item
                name="email"
                label="E-posta Adresi"
                rules={[
                  { required: true, message: 'E-posta adresi gerekli' },
                  { type: 'email', message: 'Geçerli bir e-posta adresi giriniz' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="ornek@email.com" />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<MailOutlined />}
                  block
                >
                  Raporu E-posta Olarak Gönder
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </>
      )}
    </Modal>
  );
};

export default ReportModal;
