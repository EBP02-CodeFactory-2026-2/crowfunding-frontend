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

export type ProjectStatus = "DRAFT" | "ACTIVE" | "FUNDED" | "FAILED";

export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  fundingGoal: number;
  currentAmount: number;
  deadline: string;
  status: ProjectStatus;
  riskTag: string | null;
  creator?: { id: number; fullName: string };
  createdAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  imageUrl?: string;
  fundingGoal: number;
  deadline: string;
}

// HU-1.1.6: GET /projects/me (title puede ser null en un borrador)
export interface MyProject {
  id: string;
  title: string | null;
  status: ProjectStatus;
  createdAt: string;
  currentAmount: number;
  backersCount: number;
}

// HU-2.1.6 y HU-2.1.7: cuerpo de POST /projects (crea borrador) y de PUT /projects/{id}
// Todo es opcional porque un borrador puede estar incompleto.
// En un proyecto ACTIVE NO se deben enviar fundingGoal ni deadline.
export interface SaveProjectRequest {
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  fundingGoal?: number | null;
  deadline?: string | null;
}

// Respuesta de POST /projects y de PUT /projects/{id}
export interface SavedProject {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  fundingGoal: number | null;
  currentAmount: number;
  deadline: string | null;
  status: ProjectStatus;
  riskTag: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// HU-2.1.8: respuesta de POST /projects/{id}/publish
export interface PublishResponse {
  id: string;
  title: string;
  status: ProjectStatus;
  riskScore: number;
  riskTag: string;
  fundingGoal: number;
  deadline: string;
  updatedAt: string;
}

// HU-2.2.1: cuerpo y respuesta de POST /projects/{id}/contributions
export interface ContributionRequest {
  amount: number;
  paymentMethod: string; // por ahora "SIMULATED_CARD"
  nonce: string; // codigo de un solo uso, generado por el frontend
}

export interface ContributionResponse {
  contributionId: string;
  projectId: string;
  amount: number;
  status: string;
  transaction: {
    referenceCode: string;
    paymentMethod: string;
    processedAt: string;
  };
  projectNewAmount: number;
  createdAt: string;
}