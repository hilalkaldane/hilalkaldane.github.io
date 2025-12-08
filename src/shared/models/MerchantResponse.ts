interface MerchantResponse {
  merchantNameId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  location: number[]; // [lat, lng]
  status: string;     // MerchantStatus enum as string
  createdAt: string;  // ISO
  updatedAt: string;  // ISO
  category: string;
  subCategories: string[];
}