import type { Pool, PoolClient } from 'pg';
import { database } from '../../lib/database.js';
import { AppError } from '../../errors/app-error.js';
import { serializeVector } from '../search/vector.js';
import { mapProduct, mapSearchProduct } from './product.mapper.js';
import type { ProductInput, ProductRecord, ProductUpdate, SearchProduct } from './product.types.js';

const columns = `id, sku, name, description, category, tags, price, active,
  embedding_model, embedding_content_hash, embedded_at, created_at, updated_at`;

export class ProductRepository {
  constructor(private readonly pool: Pool = database) {}

  async catalogVersion(): Promise<number> {
    const result = await this.pool.query<{ version: string }>(
      'SELECT version FROM catalog_metadata WHERE singleton = TRUE'
    );
    return Number(result.rows[0]?.version ?? 1);
  }

  async list(page: number, pageSize: number): Promise<{ products: ProductRecord[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [items, count] = await Promise.all([
      this.pool.query(`SELECT ${columns} FROM products WHERE active = TRUE ORDER BY id LIMIT $1 OFFSET $2`, [pageSize, offset]),
      this.pool.query<{ count: string }>('SELECT COUNT(*) FROM products WHERE active = TRUE')
    ]);
    return { products: items.rows.map((row) => mapProduct(row as never)), total: Number(count.rows[0]?.count ?? 0) };
  }

  async findById(id: string): Promise<ProductRecord | undefined> {
    const result = await this.pool.query(`SELECT ${columns} FROM products WHERE id = $1`, [id]);
    return result.rows[0] ? mapProduct(result.rows[0] as never) : undefined;
  }

  async search(vector: readonly number[], dimensions: number, limit: number): Promise<SearchProduct[]> {
    const serialized = serializeVector(vector, dimensions);
    const result = await this.pool.query(
      `SELECT ${columns}, embedding <=> $1::vector AS distance
       FROM products
       WHERE active = TRUE
       ORDER BY embedding <=> $1::vector, id
       LIMIT $2`,
      [serialized, limit]
    );
    return result.rows.map((row) => mapSearchProduct(row as never));
  }

  async upsertSeed(
    product: ProductInput,
    embedding: readonly number[],
    dimensions: number,
    model: string,
    hash: string
  ): Promise<'created' | 'updated' | 'unchanged'> {
    const existing = await this.pool.query<{ id: string; embedding_content_hash: string; embedding_model: string }>(
      'SELECT id, embedding_content_hash, embedding_model FROM products WHERE sku = $1',
      [product.sku]
    );
    const current = existing.rows[0];
    if (current?.embedding_content_hash === hash && current.embedding_model === model) {
      const state = await this.pool.query(
        `UPDATE products SET name=$2, description=$3, category=$4, tags=$5, price=$6, active=$7, updated_at=NOW()
         WHERE sku=$1 AND (name, description, category, tags, price, active) IS DISTINCT FROM ($2, $3, $4, $5, $6::numeric, $7)
         RETURNING id`,
        [product.sku, product.name, product.description, product.category, product.tags, product.price, product.active]
      );
      if (state.rowCount) await this.incrementVersion(this.pool);
      return state.rowCount ? 'updated' : 'unchanged';
    }

    const serialized = serializeVector(embedding, dimensions);
    const result = await this.pool.query(
      `INSERT INTO products (sku, name, description, category, tags, price, active, embedding, embedding_model, embedding_content_hash, embedded_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::vector,$9,$10,NOW())
       ON CONFLICT (sku) DO UPDATE SET
         name=EXCLUDED.name, description=EXCLUDED.description, category=EXCLUDED.category,
         tags=EXCLUDED.tags, price=EXCLUDED.price, active=EXCLUDED.active,
         embedding=EXCLUDED.embedding, embedding_model=EXCLUDED.embedding_model,
         embedding_content_hash=EXCLUDED.embedding_content_hash, embedded_at=NOW(), updated_at=NOW()
       RETURNING (xmax = 0) AS inserted`,
      [product.sku, product.name, product.description, product.category, product.tags, product.price, product.active, serialized, model, hash]
    );
    await this.incrementVersion(this.pool);
    return result.rows[0]?.inserted ? 'created' : 'updated';
  }

  async update(
    id: string,
    update: ProductUpdate,
    embeddingChange?: { vector: readonly number[]; dimensions: number; model: string; hash: string }
  ): Promise<ProductRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query(`SELECT ${columns} FROM products WHERE id=$1 FOR UPDATE`, [id]);
      if (!existing.rows[0]) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'The requested product was not found.');

      const current = mapProduct(existing.rows[0] as never);
      const next = { ...current, ...update };
      const vectorSql = embeddingChange ? '$8::vector' : 'embedding';
      const modelSql = embeddingChange ? '$9' : 'embedding_model';
      const hashSql = embeddingChange ? '$10' : 'embedding_content_hash';
      const embeddedAtSql = embeddingChange ? 'NOW()' : 'embedded_at';
      const values: unknown[] = [id, next.name, next.description, next.category, next.tags, next.price, next.active];
      if (embeddingChange) {
        values.push(serializeVector(embeddingChange.vector, embeddingChange.dimensions), embeddingChange.model, embeddingChange.hash);
      }

      const saved = await client.query(
        `UPDATE products SET name=$2, description=$3, category=$4, tags=$5, price=$6, active=$7,
         embedding=${vectorSql}, embedding_model=${modelSql}, embedding_content_hash=${hashSql},
         embedded_at=${embeddedAtSql}, updated_at=NOW()
         WHERE id=$1 RETURNING ${columns}`,
        values
      );
      await this.incrementVersion(client);
      await client.query('COMMIT');
      return mapProduct(saved.rows[0] as never);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async allForReindex(): Promise<Array<ProductRecord & { canonicalFields: ProductInput }>> {
    const result = await this.pool.query(`SELECT ${columns} FROM products ORDER BY id`);
    return result.rows.map((row) => {
      const product = mapProduct(row as never);
      return {
        ...product,
        canonicalFields: {
          sku: product.sku,
          name: product.name,
          description: product.description,
          category: product.category,
          tags: product.tags,
          price: product.price,
          active: product.active
        }
      };
    });
  }

  private async incrementVersion(client: Pick<Pool | PoolClient, 'query'>): Promise<void> {
    await client.query('UPDATE catalog_metadata SET version=version+1, updated_at=NOW() WHERE singleton=TRUE');
  }
}
