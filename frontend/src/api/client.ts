import type { Company, CompanyWithFinancials, FinancialData } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Companies
  getCompanies: () => request<Company[]>('/companies'),
  
  getCompany: (id: string) => request<CompanyWithFinancials>(`/companies/${id}`),
  
  createCompany: (data: Omit<Company, 'id' | 'created_at' | 'updated_at'>) =>
    request<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateCompany: (id: string, data: Omit<Company, 'id' | 'created_at' | 'updated_at'>) =>
    request<Company>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteCompany: (id: string) =>
    request<{ message: string }>(`/companies/${id}`, {
      method: 'DELETE',
    }),

  // Financials
  getFinancials: (companyId: string) =>
    request<FinancialData[]>(`/companies/${companyId}/financials`),
  
  createFinancial: (companyId: string, data: Omit<FinancialData, 'id'>) =>
    request<FinancialData>(`/companies/${companyId}/financials`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateFinancial: (companyId: string, financialId: string, data: Omit<FinancialData, 'id'>) =>
    request<FinancialData>(`/companies/${companyId}/financials/${financialId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteFinancial: (companyId: string, financialId: string) =>
    request<{ message: string }>(`/companies/${companyId}/financials/${financialId}`, {
      method: 'DELETE',
    }),
};

