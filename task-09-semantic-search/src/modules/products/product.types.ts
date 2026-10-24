export interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: string;
  active: boolean;
  embeddingModel: string;
  embeddingContentHash: string;
  embeddedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  sku: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: string;
  active: boolean;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  price?: string;
  active?: boolean;
}

export interface SearchProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: string;
  similarity: number;
}
