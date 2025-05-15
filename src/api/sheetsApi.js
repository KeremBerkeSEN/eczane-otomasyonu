import axios from 'axios';

// Ana Sheet URL'si
const BASE_URL = 'https://api.sheetbest.com/sheets/640518f6-479c-40b2-ba78-a229e7f32a81';

// Çalışanlar tablosunu çek
export const fetchEmployees = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/tabs/Calisanlar`); // Doğru tab adı
    console.log('fetchEmployees response:', response.data); // API yanıtını logla
    return response.data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

// İlaçlar tablosunu çek
export const fetchMedicines = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/tabs/Ilaclar`);
    console.log('fetchMedicines response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching medicines:', error);
    throw error;
  }
};

const getNextId = async () => {
  try {
    const medicines = await fetchMedicines();
    const maxId = medicines.reduce((max, medicine) => {
      const currentId = parseInt(medicine.id) || 0;
      return currentId > max ? currentId : max;
    }, 0);
    return (maxId + 1).toString();
  } catch (error) {
    console.error('Error getting next ID:', error);
    return '1'; // Start from 1 if no existing medicines
  }
};

export const addMedicine = async (medicine) => {
  try {
    const nextId = await getNextId();
    const medicineWithId = {
      ...medicine,
      id: nextId
    };
    
    // Wait for the POST request to complete
    await axios.post(`${BASE_URL}/tabs/Ilaclar`, medicineWithId);
    
    // Return the newly added medicine data
    return medicineWithId;
  } catch (error) {
    console.error('Error adding medicine:', error);
    throw error;
  }
};

export const updateMedicine = async (medicine) => {
  try {
    // Send all medicine data in the update
    await axios.put(`${BASE_URL}/tabs/Ilaclar/id/${medicine.id}`, {
      id: medicine.id,
      ilac_adi: medicine.ilac_adi,
      fiyat: medicine.fiyat,
      stok: medicine.stok
    });
    
    // Fetch and return updated data
    const response = await fetchMedicines();
    return response;
  } catch (error) {
    console.error('Error updating medicine:', error);
    throw error;
  }
};

const reorderMedicineIds = async (medicines) => {
  try {
    // Sort medicines by current ID
    const sortedMedicines = [...medicines].sort((a, b) => parseInt(a.id) - parseInt(b.id));
    
    // Update each medicine with new sequential IDs
    for (let i = 0; i < sortedMedicines.length; i++) {
      const medicine = sortedMedicines[i];
      const newId = (i + 1).toString();
      
      // Only update if ID has changed
      if (medicine.id !== newId) {
        await axios.put(`${BASE_URL}/tabs/Ilaclar/id/${medicine.id}`, {
          ...medicine,
          id: newId
        });
      }
    }
    
    // Fetch and return updated list
    const response = await fetchMedicines();
    return response;
  } catch (error) {
    console.error('Error reordering medicine IDs:', error);
    throw error;
  }
};

export const deleteMedicine = async (id) => {
  try {
    // First delete the medicine
    await axios.delete(`${BASE_URL}/tabs/Ilaclar/id/${id}`);
    
    // Fetch remaining medicines
    const medicines = await fetchMedicines();
    
    // Reorder IDs
    for (let i = 0; i < medicines.length; i++) {
      const medicine = medicines[i];
      const newId = (i + 1).toString();
      
      if (medicine.id !== newId) {
        await axios.put(`${BASE_URL}/tabs/Ilaclar/id/${medicine.id}`, {
          ...medicine,
          id: newId
        });
      }
    }
    
    // Fetch and return the final updated list
    const response = await fetchMedicines();
    return response;
  } catch (error) {
    console.error('Error deleting medicine:', error);
    throw error;
  }
};

// Track sales in Satislar tab
export const recordSale = async (saleData) => {
  try {
    const existingSales = await fetchSales();
    const today = new Date().toISOString().split('T')[0];

    // Get next available ID
    const maxSaleId = existingSales.reduce((max, sale) => {
      const saleId = parseInt(sale.id) || 0;
      return saleId > max ? saleId : max;
    }, 0);
    
    const newSaleId = (maxSaleId + 1).toString();

    const newSale = {
      id: newSaleId,
      calisan_email: saleData.calisan_email,
      ilac_adi: saleData.ilac_adi,
      miktar: saleData.quantity, // quantity yerine miktar olarak değiştirdik
      satis_fiyati: saleData.fiyat, // fiyat yerine satis_fiyati olarak değiştirdik
      tarih: today
    };

    await axios.post(`${BASE_URL}/tabs/Satislar`, newSale);
    return newSale;
  } catch (error) {
    console.error('Error recording sale:', error);
    throw error;
  }
};

export const fetchSales = async () => {
  try {
    // Get raw sales data directly from Satislar tab
    const response = await axios.get(`${BASE_URL}/tabs/Satislar`);
    console.log('Raw sales data:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

// Satış güncelleme fonksiyonu güncellendi
export const updateSale = async (saleData) => {
  try {
    await axios.put(`${BASE_URL}/tabs/Satislar/id/${saleData.id}`, {
      id: saleData.id,
      calisan_email: saleData.calisan_email,
      ilac_adi: saleData.ilac_adi,
      miktar: saleData.miktar,
      satis_fiyati: saleData.satis_fiyati,
      tarih: saleData.tarih
    });
    
    const updatedSales = await fetchSales();
    return updatedSales;
  } catch (error) {
    console.error('Update sale error:', error);
    throw error;
  }
};
