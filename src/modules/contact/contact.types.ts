export interface CreateContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponseDto {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
}