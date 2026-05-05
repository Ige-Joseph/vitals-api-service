export interface CreateWaitlistInput {
  email: string;
  name?: string;
  marketingConsent: boolean;
}

export interface WaitlistResponseDto {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

