import { AuthProvider } from "@refinedev/core";
import { activityLogService } from "../services/activityLogService";

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      // In production, this would call your API
      // For demo, we'll accept specific credentials
      const validCredentials = [
        { email: "demo@lamattressstore.com", password: "demo123", role: "agent", name: "Demo Usuario", id: "emp-demo" },
        { email: "maria.garcia@lamattressstore.com", password: "demo123", role: "agent", name: "María García", id: "emp-001" },
        { email: "john.smith@lamattressstore.com", password: "demo123", role: "manager", name: "John Smith", id: "emp-002" },
        { email: "admin@lamattressstore.com", password: "admin123", role: "admin", name: "Admin User", id: "admin-001" },
      ];

      const user = validCredentials.find(
        (cred) => cred.email === email && cred.password === password
      );

      if (user) {
        // Fetch employee data from the API
        const response = await fetch(`${API_URL}/employees/${user.id}`);
        const employeeData = await response.json();

        const userData = {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: employeeData.firstName || user.name.split(" ")[0],
          lastName: employeeData.lastName || user.name.split(" ")[1],
          role: user.role,
          storeId: employeeData.storeId || "store-001",
          avatar: employeeData.avatar || `/avatars/${user.name.split(" ")[0].toLowerCase()}.jpg`,
          employeeId: employeeData.employeeId,
        };

        localStorage.setItem("auth", JSON.stringify(userData));
        
        // Log login activity
        activityLogService.logLogin({
          email: user.email,
          role: user.role,
          storeId: userData.storeId
        });
        
        return {
          success: true,
          redirectTo: "/",
        };
      }

      return {
        success: false,
        error: {
          message: "Login failed",
          name: "Invalid email or password",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: "Login failed",
          name: "An error occurred during login",
        },
      };
    }
  },

  logout: async () => {
    // Log logout activity before removing auth
    try {
      await activityLogService.logLogout();
    } catch (error) {
      console.error('Error logging logout:', error);
    }
    
    localStorage.removeItem("auth");
    return {
      success: true,
      redirectTo: "/login",
    };
  },

  check: async () => {
    try {
      const auth = localStorage.getItem("auth");
      if (auth) {
        return {
          authenticated: true,
        };
      }

      return {
        authenticated: false,
        redirectTo: "/login",
      };
    } catch (error) {
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }
  },

  getPermissions: async () => {
    const auth = localStorage.getItem("auth");
    if (auth) {
      const user = JSON.parse(auth);
      return user.role;
    }
    return null;
  },

  getIdentity: async () => {
    const auth = localStorage.getItem("auth");
    if (auth) {
      const user = JSON.parse(auth);
      return user;
    }
    return null;
  },

  onError: async (error) => {
    if (error.response?.status === 401) {
      return {
        logout: true,
      };
    }

    return { error };
  },
};
