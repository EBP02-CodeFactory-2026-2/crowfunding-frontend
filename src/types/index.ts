
export interface RegisterRequest {
  fullName: string;
  email: string;
  password?: string;
}


export interface RegisterResponse {
  id: number;
  fullName: string;
  email: string;
  role?: string;
  createdAt?: string;
}


export interface LoginRequest {
  email: string;
  password: string;
}


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

export interface ApiError {
  timestamp?: string;
  status?: number;
  error?: string;
  message: string;
  path?: string;
  details?: Array<{ field?: string; issue: string; [key: string]: any }> | null;
}


export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  fundingGoal: number;
  currentAmount: number;
  deadline: string;
  status: "DRAFT" | "ACTIVE" | "FUNDED" | "FAILED" | "CANCELLED";
  createdAt?: string;
  riskTag?: string | null;
  riskScore?: number | null;
  backersCount?: number;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  imageUrl?: string;
  fundingGoal: number;
  deadline: string;
}