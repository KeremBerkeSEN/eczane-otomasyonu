import { Modal, Table, Typography, Card, Row, Col, Statistic } from 'antd';
import { ShoppingOutlined, DollarOutlined } from '@ant-design/icons';

const { Title } = Typography;

const MedicineSaleDetailsModal = ({ visible, onCancel, medicineData }) => {
  const columns = [
    { 
      title: 'Tarih',
      dataIndex: 'tarih',
      key: 'tarih',
      width: 120
    },
    { 
      title: 'Miktar',
      dataIndex: 'miktar',
      key: 'miktar',
      width: 100,
      align: 'right'
    },
    { 
      title: 'Satış Fiyatı (₺)',
      dataIndex: 'satis_fiyati',
      key: 'satis_fiyati',
      width: 120,
      align: 'right'
    },
    { 
      title: 'Toplam (₺)',
      key: 'toplam',
      width: 120,
      align: 'right',
      render: (record) => (parseFloat(record.miktar) * parseFloat(record.satis_fiyati)).toFixed(2)
    }
  ];

  const calculateStats = () => {
    if (!medicineData?.sales?.length) return { total: 0, count: 0, average: 0 };
    
    const total = medicineData.sales.reduce((sum, sale) => 
      sum + (parseFloat(sale.miktar) * parseFloat(sale.satis_fiyati)), 0);
    return {
      total,
      count: medicineData.sales.reduce((sum, sale) => sum + parseInt(sale.miktar), 0),
      average: total / medicineData.sales.length
    };
  };

  const stats = calculateStats();

  return (
    <Modal
      title={<Title level={4}>{medicineData?.name} - Satış Detayları</Title>}
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Toplam Satış Adedi"
              value={stats.count}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Toplam Satış Tutarı"
              value={stats.total.toFixed(2)}
              prefix={<DollarOutlined />}
              suffix="₺"
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={medicineData?.sales || []}
        pagination={false}
        scroll={{ y: 400 }}
      />
    </Modal>
  );
};

export default MedicineSaleDetailsModal;
