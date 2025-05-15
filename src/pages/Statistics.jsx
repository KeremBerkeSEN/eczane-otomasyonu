import { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Spin } from 'antd';
import { Column, Pie } from '@ant-design/plots';
import { fetchSales } from '../api/sheetsApi';

const { Title } = Typography;

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [chartData, setChartData] = useState({
    byMedicine: [],
    byRevenue: [],
    byDate: []
  });

  useEffect(() => {
    const loadSalesData = async () => {
      try {
        setLoading(true);
        const sales = await fetchSales();
        setSalesData(sales);

        // Improved data processing
        const medicineStats = sales.reduce((acc, sale) => {
          const key = sale.ilac_adi;
          if (!acc[key]) {
            acc[key] = {
              name: key,
              quantity: 0,
              revenue: 0
            };
          }

          const quantity = parseInt(sale.miktar) || 0;
          const price = parseFloat(sale.satis_fiyati) || 0;
          const saleAmount = quantity * price;

          acc[key].quantity += quantity;
          acc[key].revenue += saleAmount;

          return acc;
        }, {});

        // Transform data for charts
        const byMedicine = Object.entries(medicineStats).map(([name, data]) => ({
          ilac: name,
          miktar: data.quantity
        }));

        const byRevenue = Object.entries(medicineStats).map(([name, data]) => ({
          type: name,
          value: parseFloat(data.revenue.toFixed(2))
        }));

        setChartData({
          byMedicine,
          byRevenue
        });

      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSalesData();
  }, []);

  const columnConfig = {
    xField: 'ilac',
    yField: 'miktar',
    label: {
      // Fixed position value
      position: 'top',
      style: {
        fill: '#000000',
        opacity: 0.8,
      },
    },
    meta: {
      ilac: { alias: 'İlaç Adı' },
      miktar: { alias: 'Satış Miktarı' }
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: false,
        autoEllipsis: true
      }
    }
  };

  const pieConfig = {
    appendPadding: 10,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      position: 'outside', // Changed from 'outer' to 'outside'
      style: { textAlign: 'center' },
      formatter: (datum) => `${datum.type}\n${datum.value.toFixed(2)}₺`
    },
    tooltip: {
      formatter: (datum) => ({
        name: datum.type,
        value: `${datum.value.toFixed(2)}₺`
      })
    },
    legend: {
      layout: 'vertical',
      position: 'right',
      itemName: {
        style: {
          fontSize: 14
        }
      }
    },
    interactions: [
      { type: 'element-active' },
      { type: 'legend-highlight' }
    ]
  };

  return (
    <div>
      <Title level={3}>Satış İstatistikleri</Title>

      {loading ? (
        <Spin size="large" />
      ) : (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="İlaçlara Göre Satış Miktarları">
              <Column {...columnConfig} data={chartData.byMedicine} />
            </Card>
          </Col>
          
          <Col span={24}>
            <Card title="İlaçlara Göre Gelir Dağılımı">
              <div style={{ height: 400 }}>
                <Pie {...pieConfig} data={chartData.byRevenue} />
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Statistics;
