export interface DocumentShareResponseDto {
  url: string;
  expiresAt: string;
  contact: {
    email: string | null;
    phone: string | null;
  };
}
