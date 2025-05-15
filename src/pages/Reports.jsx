import { useState, useEffect } from 'react';
import { Typography, Button, Table, Space, Card, Spin } from 'antd';
import { fetchSales, fetchMedicines, fetchEmployees } from '../api/sheetsApi';
import ReportModal from '../components/ReportModal';

const { Title, Text } = Typography;

const Reports = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);

  const columns = [
    { 
      title: 'İlaç Adı', 
      dataIndex: 'ilac_adi', 
      key: 'ilac_adi',
      sorter: (a, b) => a.ilac_adi.localeCompare(b.ilac_adi)
    },
    { 
      title: 'Satış Yapan', 
      dataIndex: 'calisan_ad', 
      key: 'calisan_ad' 
    },
    { 
      title: 'Miktar', 
      dataIndex: 'miktar', 
      key: 'miktar',
      align: 'right',
      sorter: (a, b) => parseInt(a.miktar) - parseInt(b.miktar)
    },
    { 
      title: 'Birim Fiyat (₺)', 
      dataIndex: 'satis_fiyati', 
      key: 'satis_fiyati',
      align: 'right',
      render: (value) => parseFloat(value).toFixed(2)
    },
    { 
      title: 'Toplam (₺)', 
      dataIndex: 'toplam', 
      key: 'toplam',
      align: 'right',
      render: (_, record) => (
        (parseFloat(record.miktar) * parseFloat(record.satis_fiyati)).toFixed(2)
      )
    },
    { 
      title: 'Tarih', 
      dataIndex: 'tarih', 
      key: 'tarih',
      sorter: (a, b) => new Date(a.tarih) - new Date(b.tarih),
      render: (date) => new Date(date).toLocaleDateString('tr-TR')
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [salesResult, medicinesData, employeesData] = await Promise.all([
          fetchSales(),
          fetchMedicines(),
          fetchEmployees()
        ]);

        const processedSales = salesResult.map(sale => ({
          ...sale,
          key: `${sale.id}-${sale.tarih}`,
          calisan_ad: employeesData.find(emp => emp.email === sale.calisan_email)?.ad || 'Bilinmiyor'
        }));

        setSalesData(processedSales);
        setMedicines(medicinesData);
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const calculateTotals = () => {
    return salesData.reduce((acc, curr) => ({
      amount: acc.amount + (parseFloat(curr.miktar) * parseFloat(curr.satis_fiyati)),
      count: acc.count + parseInt(curr.miktar)
    }), { amount: 0, count: 0 });
  };

  const totals = calculateTotals();

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3}>Satışlar ve Raporlama</Title>
          <Button 
            type="primary" 
            onClick={() => setIsModalVisible(true)}
          >
            Yeni Rapor Oluştur
          </Button>
        </div>

        <Space size="large">
          <Card>
            <Title level={4}>Toplam Satış Adedi</Title>
            <Text>{totals.count}</Text>
          </Card>
          <Card>
            <Title level={4}>Toplam Gelir</Title>
            <Text>{totals.amount.toFixed(2)} ₺</Text>
          </Card>
        </Space>

        {loading ? (
          <Spin size="large" />
        ) : (
          <Table
            columns={columns}
            dataSource={salesData}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Toplam ${total} kayıt`
            }}
          />
        )}
      </Space>

      <ReportModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        medicines={medicines}
      />
    </div>
  );
};

export default Reports;
