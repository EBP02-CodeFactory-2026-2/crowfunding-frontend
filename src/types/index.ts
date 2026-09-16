// Lo que el backend espera al registrarse
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

// Lo que el backend devuelve tras un registro exitoso
export interface RegisterResponse {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
}

// Lo que el backend espera al iniciar sesión
export interface LoginRequest {
  email: string;
  password: string;
}

// Lo que el backend devuelve tras un login exitoso
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
}

// Formato de error unificado del backend (400, 409, etc.)
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details: { field: string; issue: string }[] | null;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  fundingGoal: number;
  currentAmount: number;
  deadline: string;
  status: "DRAFT" | "ACTIVE" | "FUNDED" | "FAILED";
  createdAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  imageUrl?: string;
  fundingGoal: number;
  deadline: string;
}