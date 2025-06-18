import { DataProvider } from "@refinedev/core";
import axios from "axios";
import { activityLogService } from "../services/activityLogService";
import { ACTIVITY_RESOURCES } from "../interfaces/activityLog";

// Función para obtener la URL base de la API
const getApiUrl = () => {
  // Si estamos en producción, usar URLs relativas
  if (import.meta.env.PROD) {
    // En producción, las APIs están en el mismo dominio
    return "";
  }
  
  // En desarrollo, usar la variable de entorno o fallback
  return import.meta.env.VITE_API_URL || "http://127.0.0.1:3001";
};

// Use environment variable or fallback
const API_URL = getApiUrl();

console.log('🔧 API URL configured as:', API_URL || 'Relative URLs (same origin)');

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`API Response for ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.error(`API Error for ${error.config?.url}:`, error);
    return Promise.reject(error);
  }
);

// Helper function to get resource name for activity logging
const getActivityResource = (resource: string): string => {
  const resourceMap: { [key: string]: string } = {
    customers: ACTIVITY_RESOURCES.CUSTOMERS,
    subscriptions: ACTIVITY_RESOURCES.SUBSCRIPTIONS,
    evaluations: ACTIVITY_RESOURCES.EVALUATIONS,
    employees: ACTIVITY_RESOURCES.EMPLOYEES,
    stores: ACTIVITY_RESOURCES.STORES,
    calls: ACTIVITY_RESOURCES.CALLS,
    sales: ACTIVITY_RESOURCES.SALES,
    campaigns: ACTIVITY_RESOURCES.CAMPAIGNS,
    commissions: ACTIVITY_RESOURCES.COMMISSIONS,
    achievements: ACTIVITY_RESOURCES.ACHIEVEMENTS,
    scripts: ACTIVITY_RESOURCES.SCRIPTS,
    shopifySettings: ACTIVITY_RESOURCES.SHOPIFY_SETTINGS,
    shopifyProducts: ACTIVITY_RESOURCES.SHOPIFY_PRODUCTS,
    shopifyCustomers: ACTIVITY_RESOURCES.SHOPIFY_CUSTOMERS,
    shopifyCoupons: ACTIVITY_RESOURCES.SHOPIFY_COUPONS,
  };
  
  return resourceMap[resource] || resource;
};

export const customDataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    console.log(`Getting list for resource: ${resource}`);
    
    try {
      const response = await axiosInstance.get(`/${resource}`);
      
      // json-server returns array directly
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Log view activity for important resources
      if (['customers', 'employees', 'sales'].includes(resource)) {
        activityLogService.logView(getActivityResource(resource), 'list', {
          count: data.length,
          filters,
        });
      }
      
      return {
        data: data,
        total: data.length,
      };
    } catch (error) {
      console.error(`Error fetching ${resource}:`, error);
      throw error;
    }
  },

  getOne: async ({ resource, id }) => {
    const response = await axiosInstance.get(`/${resource}/${id}`);
    
    // Log view activity
    activityLogService.logView(getActivityResource(resource), id, {
      timestamp: new Date().toISOString(),
    });
    
    return {
      data: response.data,
    };
  },

  create: async ({ resource, variables }) => {
    const response = await axiosInstance.post(`/${resource}`, variables);
    
    // Log create activity
    activityLogService.logCreate(getActivityResource(resource), response.data.id, {
      data: variables,
    });
    
    return {
      data: response.data,
    };
  },

  update: async ({ resource, id, variables }) => {
    // Get current data for comparison
    let previousData = null;
    try {
      const currentResponse = await axiosInstance.get(`/${resource}/${id}`);
      previousData = currentResponse.data;
    } catch (error) {
      console.warn('Could not fetch previous data for comparison');
    }
    
    // json-server prefers PUT for updates with full data
    // Use PUT for resources that need full object updates
    let response;
    
    // For permissions and systemSettings, we need to send the full object
    if (['permissions', 'systemSettings'].includes(resource) && previousData) {
      response = await axiosInstance.put(`/${resource}/${id}`, {
        ...previousData,
        ...variables,
        updatedAt: new Date().toISOString()
      });
    } else {
      // For other resources, use PUT instead of PATCH for better JSON Server compatibility
      const updateData = previousData ? { ...previousData, ...variables } : variables;
      response = await axiosInstance.put(`/${resource}/${id}`, updateData);
    }
    
    // Log update activity
    activityLogService.logUpdate(
      getActivityResource(resource),
      id,
      variables,
      previousData
    );
    
    return {
      data: response.data,
    };
  },

  deleteOne: async ({ resource, id }) => {
    // Get data before deletion for logging
    let deletedData = null;
    try {
      const response = await axiosInstance.get(`/${resource}/${id}`);
      deletedData = response.data;
    } catch (error) {
      console.warn('Could not fetch data before deletion');
    }
    
    const response = await axiosInstance.delete(`/${resource}/${id}`);
    
    // Log delete activity
    activityLogService.logDelete(getActivityResource(resource), id, {
      deletedData,
      timestamp: new Date().toISOString(),
    });
    
    return {
      data: response.data,
    };
  },

  getMany: async ({ resource, ids }) => {
    console.log(`Getting many for resource: ${resource}, ids:`, ids);
    
    const responses = await Promise.allSettled(
      ids.map(async (id) => {
        try {
          const response = await axiosInstance.get(`/${resource}/${id}`);
          return response.data;
        } catch (error) {
          console.warn(`Failed to fetch ${resource}/${id}:`, error);
          return null;
        }
      })
    );
    
    // Filter out failed requests and extract successful data
    const data = responses
      .filter((response): response is PromiseFulfilledResult<any> => 
        response.status === 'fulfilled' && response.value !== null
      )
      .map(response => response.value);
    
    return {
      data,
    };
  },

  createMany: async ({ resource, variables }) => {
    const response = await Promise.all(
      variables.map((item) => axiosInstance.post(`/${resource}`, item))
    );
    
    // Log bulk create activity
    activityLogService.logCreate(getActivityResource(resource), 'bulk', {
      count: variables.length,
      ids: response.map((res) => res.data.id),
    });
    
    return {
      data: response.map((res) => res.data),
    };
  },

  deleteMany: async ({ resource, ids }) => {
    const response = await Promise.all(
      ids.map((id) => axiosInstance.delete(`/${resource}/${id}`))
    );
    
    // Log bulk delete activity
    activityLogService.logDelete(getActivityResource(resource), 'bulk', {
      count: ids.length,
      ids,
    });
    
    return {
      data: response.map((res) => res.data),
    };
  },

  updateMany: async ({ resource, ids, variables }) => {
    const response = await Promise.all(
      ids.map((id) => axiosInstance.put(`/${resource}/${id}`, variables))
    );
    
    // Log bulk update activity
    activityLogService.logUpdate(getActivityResource(resource), 'bulk', variables, {
      count: ids.length,
      ids,
    });
    
    return {
      data: response.map((res) => res.data),
    };
  },

  custom: async ({ url, method, filters, sorters, payload, query, headers }) => {
    let requestUrl = `${url}`;

    if (query) {
      const queryString = new URLSearchParams(query).toString();
      requestUrl = `${requestUrl}?${queryString}`;
    }

    const response = await axiosInstance({
      url: requestUrl,
      method,
      data: payload,
      headers,
    });

    return {
      data: response.data,
    };
  },

  getApiUrl: () => API_URL || window.location.origin,
};
