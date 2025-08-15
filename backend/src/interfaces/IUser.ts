import { UserRole } from '@prisma/client';

export { UserRole };

export interface IUser {
  id: number;
  email: string;
  name: string | null;
  password: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  loginAttempts: number;
  lockedUntil: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  refreshToken: string | null;
  refreshTokenExpires: Date | null;
  refreshTokenFamily: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserDto {
  email: string;
  name?: string | null;
  role?: UserRole;
  password: string;
  isActive?: boolean;
}

export interface IUpdateUserDto {
  email?: string;
  name?: string | null;
  role?: UserRole;
  password?: string;
  isActive?: boolean;
  lastLoginAt?: Date | null;
  loginAttempts?: number;
  lockedUntil?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
}

export interface ILoginDto {
  email: string;
  password: string;
}

export interface IAuthResponse {
  user: IUser;
  token: string;
  refreshToken?: string;
}

export interface IRefreshTokenDto {
  refreshToken: string;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface IUserRepository {
  findById(id: number): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  create(userData: ICreateUserDto): Promise<IUser>;
  update(id: number, userData: IUpdateUserDto): Promise<IUser>;
  delete(id: number): Promise<void>;
  updateLastLogin(userId: number): Promise<void>;
  incrementLoginAttempts(userId: number): Promise<void>;
  lockAccount(userId: number, lockUntil: Date): Promise<void>;
  setPasswordResetToken(userId: number, token: string, expires: Date): Promise<void>;
  clearPasswordResetToken(userId: number): Promise<void>;
  findByPasswordResetToken(token: string): Promise<IUser | null>;
  setRefreshToken(userId: number, refreshToken: string, expires: Date, family: string): Promise<void>;
  clearRefreshToken(userId: number): Promise<void>;
  findByRefreshToken(refreshToken: string): Promise<IUser | null>;
  revokeRefreshTokenFamily(family: string): Promise<void>;
}

export interface ILogoutDto {
  token: string;
}

export interface IRegisterDto {
  email: string;
  name?: string;
  password: string;
  role?: UserRole;
}

export interface IChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface IResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface IAuthService {
  login(credentials: ILoginDto): Promise<IAuthResponse>;
  logout(logoutData: ILogoutDto): Promise<void>;
  register(userData: IRegisterDto): Promise<IAuthResponse>;
  changePassword(userId: number, passwordData: IChangePasswordDto): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(resetData: IResetPasswordDto): Promise<void>;
  validateToken(token: string): Promise<IUser>;
  getCurrentUser(req: any): Promise<IUser>;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
  checkAccountLocked(user: IUser): boolean;
  incrementLoginAttempts(userId: number): Promise<void>;
  resetLoginAttempts(userId: number): Promise<void>;
  generateToken(user: IUser): string;
  generateRefreshToken(user: IUser): string;
  generateTokenPair(user: IUser): ITokenPair;
  refreshTokens(refreshTokenData: IRefreshTokenDto): Promise<ITokenPair>;
  validateRefreshToken(refreshToken: string): Promise<IUser>;
  revokeRefreshToken(refreshToken: string): Promise<void>;
}
