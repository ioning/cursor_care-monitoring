import axios from 'axios';
import { apiClient } from './client';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export type SubscriptionTier = 'basic' | 'professional' | 'enterprise';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  subscriptionTier: SubscriptionTier;
  maxWards?: number;
  maxDispatchers?: number;
  maxGuardians?: number;
  billingEmail?: string;
  contactEmail?: string;
  contactPhone?: string;
  deviceSerialNumbers?: string[];
  status: 'active' | 'trial' | 'suspended';
  trialEndsAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrganizationDto = {
  name: string;
  slug: string;
  description?: string;
  subscriptionTier?: SubscriptionTier;
  maxWards?: number;
  maxDispatchers?: number;
  maxGuardians?: number;
  billingEmail?: string;
  contactEmail?: string;
  contactPhone?: string;
  deviceSerialNumbers?: string[];
  trialDays?: number;
};

export type CreateOrganizationWithDispatcherDto = CreateOrganizationDto & {
  dispatcher: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  };
};

const mockOrganizations: Organization[] = [];

export const fetchOrganizations = async (): Promise<Organization[]> => {
  if (useMocks) {
    return Promise.resolve(structuredClone(mockOrganizations));
  }

  const { data } = await apiClient.get<{ data: Organization[] }>('/organizations');
  return data.data || [];
};

export const createOrganization = async (payload: CreateOrganizationDto): Promise<Organization> => {
  if (useMocks) {
    const mockOrg: Organization = {
      id: `org-${Date.now()}`,
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      subscriptionTier: payload.subscriptionTier || 'basic',
      maxWards: payload.maxWards,
      maxDispatchers: payload.maxDispatchers,
      maxGuardians: payload.maxGuardians,
      billingEmail: payload.billingEmail,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return Promise.resolve(mockOrg);
  }

  const { data } = await apiClient.post<{ data: Organization }>('/organizations', payload);
  return data.data;
};

export const createOrganizationWithDispatcher = async (
  payload: CreateOrganizationWithDispatcherDto,
): Promise<{ organization: Organization; dispatcher: any }> => {
  // Создаем организацию
  const organization = await createOrganization(payload);

  // Создаем диспетчера для организации
  const dispatcherData = {
    email: payload.dispatcher.email,
    password: payload.dispatcher.password,
    fullName: payload.dispatcher.fullName,
    phone: payload.dispatcher.phone,
    role: 'dispatcher',
    organizationId: organization.id,
  };

  if (useMocks) {
    const mockDispatcher = {
      id: `user-${Date.now()}`,
      ...dispatcherData,
    };
    return Promise.resolve({ organization, dispatcher: mockDispatcher });
  }

  // Регистрируем диспетчера через auth service
  // Используем прямой URL, так как apiClient настроен на /admin
  const token = localStorage.getItem('accessToken');
  const { data } = await axios.post(`${API_BASE_URL}/auth/register`, dispatcherData, {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      'Content-Type': 'application/json',
    },
  });
  
  return {
    organization,
    dispatcher: data.data?.user || data.user,
  };
};

export const getOrganization = async (id: string): Promise<Organization> => {
  if (useMocks) {
    return Promise.resolve(mockOrganizations.find((org) => org.id === id)!);
  }

  const { data } = await apiClient.get<{ data: Organization }>(`/organizations/${id}`);
  return data.data;
};

export const updateOrganization = async (
  id: string,
  payload: Partial<CreateOrganizationDto>,
): Promise<Organization> => {
  if (useMocks) {
    return Promise.resolve(mockOrganizations.find((org) => org.id === id)!);
  }

  const { data } = await apiClient.put<{ data: Organization }>(`/organizations/${id}`, payload);
  return data.data;
};

