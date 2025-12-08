export interface CampaignResponse {
  id: string;
  merchantNameId: string;
  merchantName: string;
  title: string;
  description: string;
  offerType: string;
  parameters: Record<string, unknown>;
  validUntil: string;          // LocalDateTime → ISO string
  termsConditions: string[];
  status: string;
  createdAt: string;
}