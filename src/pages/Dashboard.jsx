import { useEffect, useState } from 'react';
import { Table, Typography, Spin, Input, Button, Modal, Form, InputNumber, message, Space, Popconfirm, notification } from 'antd';
import { fetchMedicines, addMedicine, updateMedicine, deleteMedicine, recordSale, fetchSales, fetchEmployees, updateSale } from '../api/sheetsApi';
import { BarChartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

const Dashboard = ({ user, onMedicinesChange }) => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaleModalVisible, setIsSaleModalVisible] = useState(false);
  const [isPriceModalVisible, setIsPriceModalVisible] = useState(false);
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medicineDetails, setMedicineDetails] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [saleForm] = Form.useForm();
  const [priceForm] = Form.useForm();
  const [stockForm] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const data = await fetchMedicines();
        setMedicines(data);
        onMedicinesChange(data);
      } catch (err) {
        console.error('İlaç verileri alınamadı:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMedicines();
  }, [onMedicinesChange]);

  const filteredMedicines = medicines
    .filter(medicine => medicine?.ilac_adi?.toLowerCase().startsWith(searchText.toLowerCase() || ''))
    .sort((a, b) => parseInt(a.id) - parseInt(b.id));

  const handleAddMedicine = async (values) => {
    try {
      const duplicateMedicine = medicines.find(
        m => m.ilac_adi.toLowerCase() === values.ilac_adi.toLowerCase()
      );

      if (duplicateMedicine) {
        form.setFields([
          {
            name: 'ilac_adi',
            errors: ['Bu isimli bir ilaç zaten kayıtlı']
          }
        ]);
        return;
      }

      setLoading(true);
      const newMedicine = await addMedicine(values);
      setMedicines(prevMedicines => [...prevMedicines, newMedicine]);
      onMedicinesChange([...medicines, newMedicine]);
      const newTotalItems = medicines.length + 1;
      const lastPage = Math.ceil(newTotalItems / pagination.pageSize);
      setPagination(prev => ({ ...prev, current: lastPage }));
      
      api.success({
        message: 'İlaç Başarıyla Eklendi',
        description: `${values.ilac_adi} isimli ilaç başarıyla eklendi.`,
        placement: 'topRight',
        duration: 3
      });

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      api.error({
        message: 'İlaç Ekleme Başarısız',
        description: 'İşlem sırasında bir hata oluştu.',
        placement: 'topRight'
      });
      console.error('Add medicine error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSale = async (values) => {
    try {
      if (values.quantity > selectedMedicine?.stok) {
        message.error('Yeterli stok bulunmamaktadır');
        return;
      }

      setLoading(true);
      
      const allSales = await fetchSales();
      const today = new Date().toISOString().split('T')[0];

      const existingSale = allSales.find(sale => 
        sale.ilac_adi === selectedMedicine.ilac_adi &&
        parseFloat(sale.satis_fiyati) === parseFloat(selectedMedicine.fiyat) &&
        sale.calisan_email === user.email &&
        sale.tarih === today
      );

      const updatedMedicine = {
        ...selectedMedicine,
        stok: parseInt(selectedMedicine.stok) - parseInt(values.quantity)
      };
      
      if (updatedMedicine.stok < 0) {
        message.error('Stok miktarı 0\'ın altına düşemez');
        return;
      }

      await updateMedicine(updatedMedicine);

      if (existingSale) {
        const updatedSale = {
          ...existingSale,
          miktar: parseInt(existingSale.miktar) + parseInt(values.quantity)
        };
        await updateSale(updatedSale);
      } else {
        await recordSale({
          ilac_adi: selectedMedicine.ilac_adi,
          quantity: values.quantity,
          fiyat: selectedMedicine.fiyat,
          calisan_email: user.email
        });
      }
      
      const updatedData = await fetchMedicines();
      setMedicines(updatedData);
      onMedicinesChange(updatedData);
      
      api.success({
        message: 'Satış Başarıyla Tamamlandı',
        description: `${selectedMedicine.ilac_adi} ilacından ${values.quantity} adet satıldı.`,
        placement: 'topRight',
        duration: 3
      });
      
      setIsSaleModalVisible(false);
      saleForm.resetFields();
    } catch (error) {
      api.error({
        message: 'Satış İşlemi Başarısız',
        description: 'İşlem sırasında bir hata oluştu.',
        placement: 'topRight'
      });
      console.error('Sale error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const medicineToDelete = medicines.find(med => med.id === id);
      const updatedData = await deleteMedicine(id);
      setMedicines(updatedData);
      onMedicinesChange(updatedData);
      
      api.success({
        message: 'İlaç Başarıyla Silindi',
        description: `${medicineToDelete.ilac_adi} isimli ilaç kayıtlardan kaldırıldı.`,
        placement: 'topRight',
        duration: 3
      });
    } catch (error) {
      api.error({
        message: 'İlaç Silme Başarısız',
        description: 'İşlem sırasında bir hata oluştu.',
        placement: 'topRight'
      });
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceUpdate = async (values) => {
    try {
      setLoading(true);
      const updatedMedicine = {
        ...selectedMedicine,
        fiyat: values.fiyat
      };
      
      const updatedData = await updateMedicine(updatedMedicine);
      setMedicines(updatedData);
      onMedicinesChange(updatedData);
      
      api.success({
        message: 'Fiyat Başarıyla Güncellendi',
        description: `${selectedMedicine.ilac_adi} ilacının fiyatı ${values.fiyat}₺ olarak güncellendi.`,
        placement: 'topRight',
        duration: 3
      });

      setIsPriceModalVisible(false);
      priceForm.resetFields();
    } catch (error) {
      api.error({
        message: 'Fiyat Güncelleme Başarısız',
        description: 'İşlem sırasında bir hata oluştu.',
        placement: 'topRight'
      });
      console.error('Price update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdd = async (values) => {
    try {
      setLoading(true);
      const updatedMedicine = {
        ...selectedMedicine,
        stok: parseInt(selectedMedicine.stok || 0) + parseInt(values.quantity)
      };
      
      const updatedData = await updateMedicine(updatedMedicine);
      setMedicines(updatedData);
      onMedicinesChange(updatedData);
      
      api.success({
        message: 'Stok Başarıyla Güncellendi',
        description: `${selectedMedicine.ilac_adi} ilacına ${values.quantity} adet stok eklendi.`,
        placement: 'topRight',
        duration: 3
      });

      setIsStockModalVisible(false);
      stockForm.resetFields();
    } catch (error) {
      api.error({
        message: 'Stok Güncelleme Başarısız',
        description: 'İşlem sırasında bir hata oluştu.',
        placement: 'topRight'
      });
      console.error('Stock update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetails = async (medicine) => {
    try {
      setLoading(true);
      const allSales = await fetchSales();
      const employees = await fetchEmployees();
      const uniqueSalesMap = new Map();
      
      allSales
        .filter(sale => sale.ilac_adi === medicine.ilac_adi)
        .forEach(sale => {
          const uniqueKey = `${sale.ilac_adi}-${sale.tarih}-${sale.satis_fiyati}-${sale.calisan_email}`;
          uniqueSalesMap.set(uniqueKey, {
            ...sale,
            key: uniqueKey,
            calisan_ad: employees.find(emp => emp.email === sale.calisan_email)?.ad || 'Bilinmiyor',
            miktar: parseInt(sale.miktar) || 0,
            satis_fiyati: parseFloat(sale.satis_fiyati) || 0,
            toplam: ((parseInt(sale.miktar) || 0) * (parseFloat(sale.satis_fiyati) || 0)).toFixed(2)
          });
        });
      const uniqueSales = Array.from(uniqueSalesMap.values())
        .sort((a, b) => {
          const dateCompare = new Date(b.tarih) - new Date(a.tarih);
          if (dateCompare !== 0) return dateCompare;
          return parseFloat(b.satis_fiyati) - parseFloat(a.satis_fiyati);
        });
      
      setMedicineDetails({
        name: medicine.ilac_adi,
        sales: uniqueSales
      });
      setDetailsModalVisible(true);
    } catch (error) {
      console.error('Satış detayları alınamadı:', error);
      message.error('Satış detayları alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const saleDetailsColumns = [
    { 
      title: 'Tarih', 
      dataIndex: 'tarih', 
      key: 'tarih',
      width: 120,
      sorter: (a, b) => new Date(a.tarih) - new Date(b.tarih)
    },
    { 
      title: 'Miktar', 
      dataIndex: 'miktar', 
      key: 'miktar',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.miktar - b.miktar
    },
    { 
      title: 'Satış Fiyatı (₺)', 
      dataIndex: 'satis_fiyati', 
      key: 'satis_fiyati',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.satis_fiyati - b.satis_fiyati
    },
    { 
      title: 'Toplam (₺)', 
      dataIndex: 'toplam',
      key: 'toplam',
      width: 120,
      align: 'right',
      sorter: (a, b) => parseFloat(a.toplam) - parseFloat(b.toplam)
    },
    { 
      title: 'Satışı Yapan', 
      dataIndex: 'calisan_ad', 
      key: 'calisan_ad',
      width: 150,
      sorter: (a, b) => a.calisan_ad.localeCompare(b.calisan_ad)
    }
  ];

  const columns = [
    { 
      title: 'İlaç Adı', 
      dataIndex: 'ilac_adi', 
      key: 'ilac_adi',
      sorter: (a, b) => a.ilac_adi.localeCompare(b.ilac_adi),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
      width: 200 
    },
    { 
      title: 'Fiyat (₺)', 
      dataIndex: 'fiyat', 
      key: 'fiyat',
      sorter: (a, b) => parseFloat(a.fiyat) - parseFloat(b.fiyat),
      sortDirections: ['ascend', 'descend'],
      render: (fiyat) => parseFloat(fiyat).toFixed(2),
      width: 150 
    },
    { 
      title: 'Stok', 
      dataIndex: 'stok', 
      key: 'stok',
      sorter: (a, b) => (parseInt(a.stok) || 0) - (parseInt(b.stok) || 0),
      sortDirections: ['ascend', 'descend'],
      render: (stok) => stok || 0,
      width: 100 
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary"
            onClick={() => {
              setSelectedMedicine(record);
              setIsSaleModalVisible(true);
            }}
            disabled={!record.stok || record.stok <= 0}
          >
            Satış Yap
          </Button>
          <Button
            onClick={() => {
              setSelectedMedicine(record);
              setIsPriceModalVisible(true);
            }}
          >
            Fiyat Güncelle
          </Button>
          <Button
            onClick={() => {
              setSelectedMedicine(record);
              setIsStockModalVisible(true);
            }}
          >
            Stok Ekle
          </Button>
          <Button
            onClick={() => handleShowDetails(record)}
            icon={<BarChartOutlined />}
          >
            Detaylar
          </Button>
          <Popconfirm
            title="İlacı sil"
            description="Bu ilacı silmek istediğinizden emin misiniz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button danger>Sil</Button>
          </Popconfirm>
        </Space>
      ),
      width: 300 
    },
  ];

  return (
    <div>
      {contextHolder}
      <Title level={3}>Hoş geldin, {user.ad} 👋</Title>
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="İlaç ara..."
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          Yeni İlaç Ekle
        </Button>
      </div>

      {loading ? (
        <Spin />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredMedicines}
          rowKey={(record) => record.id} 
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
            pageSize: 8 
          }}
          scroll={{ x: 'max-content' }} 
          style={{ 
            marginBottom: 16,
            height: 'fit-content' 
          }}
          defaultSortOrder="ascend"
          sortDirections={["ascend"]}
        />
      )}

      <Modal
        title="Yeni İlaç Ekle"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form 
          form={form} 
          onFinish={(values) => {
            if (values.fiyat <= 0) {
              form.setFields([{
                name: 'fiyat',
                errors: ['Sıfırdan büyük bir sayı giriniz']
              }]);
              return;
            }
            handleAddMedicine(values);
          }} 
          layout="vertical"
        >
          <Form.Item
            name="ilac_adi"
            label="İlaç Adı"
            rules={[
              { required: true, message: 'İlaç adı gerekli' },
              {
                validator: async (_, value) => {
                  if (!value) return;
                  const duplicate = medicines.find(
                    m => m.ilac_adi.toLowerCase() === value.toLowerCase()
                  );
                  if (duplicate) {
                    throw new Error('Bu isimli bir ilaç zaten kayıtlı');
                  }
                }
              }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="fiyat"
            label="Fiyat (₺)"
            rules={[
              { required: true, message: 'Fiyat gerekli' },
              { type: 'number', min: 0.01, message: 'Sıfırdan büyük bir sayı giriniz' }
            ]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="stok"
            label="Stok"
            rules={[{ required: true, message: 'Stok miktarı gerekli' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Ekle
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Satış Yap"
        open={isSaleModalVisible}
        onCancel={() => {
          setIsSaleModalVisible(false);
          saleForm.resetFields();
        }}
        footer={null}
      >
        <Form 
          form={saleForm} 
          onFinish={(values) => {
            if (values.quantity <= 0) {
              saleForm.setFields([{
                name: 'quantity',
                errors: ['Sıfırdan büyük bir sayı giriniz']
              }]);
              return;
            }
            if (values.quantity > selectedMedicine?.stok) {
              saleForm.setFields([{
                name: 'quantity',
                errors: ['Yeterli sayıda stok bulunmamaktadır']
              }]);
              return;
            }
            handleSale(values);
          }}
          layout="vertical"
          initialValues={{ quantity: undefined }}
        >
          <Text>İlaç: {selectedMedicine?.ilac_adi}</Text>
          <br />
          <Text>Mevcut Stok: {selectedMedicine?.stok || 0}</Text>
          {(selectedMedicine?.stok || 0) > 0 ? (
            <Form.Item
              name="quantity"
              label="Satış Miktarı"
              rules={[
                { required: true, message: 'Satış miktarı gerekli' },
                { type: 'number', min: 1, message: 'Sıfırdan büyük bir sayı giriniz' }
              ]}
            >
              <InputNumber 
                min={0}
                precision={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
          ) : (
            <Text type="danger">Bu ilaç için yeterli stok bulunmamaktadır.</Text>
          )}
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block
            >
              Satışı Tamamla
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Fiyat Güncelle"
        open={isPriceModalVisible}
        onCancel={() => setIsPriceModalVisible(false)}
        footer={null}
      >
        <Form 
          form={priceForm} 
          onFinish={(values) => {
            if (values.fiyat <= 0) {
              priceForm.setFields([{
                name: 'fiyat',
                errors: ['Sıfırdan büyük bir sayı giriniz']
              }]);
              return;
            }
            handlePriceUpdate(values);
          }} 
          layout="vertical"
        >
          <Text>İlaç: {selectedMedicine?.ilac_adi}</Text>
          <br />
          <Text>Mevcut Fiyat: {selectedMedicine?.fiyat} ₺</Text>
          <Form.Item
            name="fiyat"
            label="Yeni Fiyat (₺)"
            rules={[
              { required: true, message: 'Yeni fiyat gerekli' },
              { type: 'number', min: 0.01, message: 'Sıfırdan büyük bir sayı giriniz' }
            ]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Güncelle
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Stok Ekle"
        open={isStockModalVisible}
        onCancel={() => {
          setIsStockModalVisible(false);
          stockForm.resetFields();
        }}
        footer={null}
      >
        <Form 
          form={stockForm} 
          onFinish={(values) => {
            if (!Number.isInteger(values.quantity)) {
              return;
            }
            handleStockAdd(values);
          }} 
          layout="vertical"
        >
          <Text>İlaç: {selectedMedicine?.ilac_adi}</Text>
          <br />
          <Text>Mevcut Stok: {selectedMedicine?.stok || 0}</Text>
          <Form.Item
            name="quantity"
            label="Eklenecek Miktar"
            rules={[
              { required: true, message: 'Miktar gerekli' },
              { type: 'number', min: 1, message: 'Sıfırdan büyük bir sayı giriniz' }
            ]}
          >
            <InputNumber 
              min={0}
              precision={0}
              style={{ width: '100%' }}
              onChange={(value) => {
                stockForm.setFieldsValue({ quantity: value });
                if (!value || value <= 0) {
                  stockForm.setFields([{
                    name: 'quantity',
                    value: value,
                    errors: ['Sıfırdan büyük bir sayı giriniz']
                  }]);
                } else if (!Number.isInteger(value)) {
                  stockForm.setFields([{
                    name: 'quantity',
                    value: value,
                    errors: ['Tam sayı giriniz']
                  }]);
                }
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block
            >
              Stok Ekle
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${medicineDetails?.name || ''} - Satış Detayları`}
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={medicineDetails?.sales || []}
          columns={saleDetailsColumns}
          pagination={false}
          rowKey={record => record.key} 
          onChange={(_, __, sorter) => {
            const { field, order } = sorter;
            if (field && order) {
              const newSales = [...medicineDetails.sales].sort((a, b) => {
                if (field === 'id') {
                  return order === 'ascend' ? a.id - b.id : b.id - a.id;
                }
                if (field === 'tarih') {
                  return order === 'ascend' 
                    ? new Date(a.tarih) - new Date(b.tarih)
                    : new Date(b.tarih) - new Date(a.tarih);
                }
                return order === 'ascend' 
                  ? a[field] > b[field] ? 1 : -1
                  : a[field] < b[field] ? 1 : -1;
              });
              setMedicineDetails(prev => ({ ...prev, sales: newSales }));
            }
          }}
          summary={pageData => {
            const totalAmount = pageData.reduce((sum, item) => sum + parseFloat(item.toplam), 0);
            const totalQuantity = pageData.reduce((sum, item) => sum + parseInt(item.miktar), 0);
            
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>Toplam</Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">{totalQuantity}</Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">-</Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">{totalAmount.toFixed(2)} ₺</Table.Summary.Cell>
                <Table.Summary.Cell index={4}></Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;
