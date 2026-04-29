/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class DynamicStudioService {
  private readonly logger = new Logger(DynamicStudioService.name);

  private readonly baseUrl = 'https://query-framework-backend.onrender.com/api';
  private readonly apiPrefix = '/v1/dynamic-rest';

  private readonly user = process.env.DYNAMIC_STUDIO_USER || 'admin';
  private readonly pass = process.env.DYNAMIC_STUDIO_PASS || 'admin123';

  async getEndpoints() {
    try {
      const fullUrl = `${this.baseUrl}${this.apiPrefix}/query-list`;
      const response = await axios.get(fullUrl, {
        auth: { username: this.user, password: this.pass },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const rawData = response.data;
      if (Array.isArray(rawData)) return rawData;
      if (rawData && Array.isArray(rawData.data)) return rawData.data;
      if (rawData && Array.isArray(rawData.results)) return rawData.results;
      return [];
    } catch (error) {
      this.logger.error(`Failed to fetch queries: ${error.message}`);
      return [];
    }
  }

  async runQuery(
    slug: string,
    parameters: any = {},
    dbCode: string = 'erp',
    filters: any[] = [],
    sorts: any[] = [],
  ) {
    const paths = [`/search/${slug}`, `/list/${slug}`, `/${slug}`];
    const methods: Array<'post' | 'get'> = ['post', 'get'];

    let lastError: any = null;

    for (const method of methods) {
      for (const path of paths) {
        try {
          const fullUrl = `${this.baseUrl}${this.apiPrefix}${path}`;
          this.logger.log(
            `Trying ${method.toUpperCase()}: ${fullUrl} (DB: ${dbCode})`,
          );

          const config: AxiosRequestConfig = {
            auth: { username: this.user, password: this.pass },
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'x-db-identifier': dbCode.toLowerCase(),
              'x-user-context': JSON.stringify({
                tenantId: '1',
                branchId: null,
              }),
            },
          };

          let response;
          if (method === 'post') {
            response = await axios.post(
              fullUrl,
              { params: parameters, parameters },
              config,
            );
          } else {
            response = await axios.get(fullUrl, {
              ...config,
              params: parameters,
            });
          }

          this.logger.log(`Success: ${method.toUpperCase()} on ${path}`);
          let data =
            response.data?.data ||
            response.data?.results ||
            response.data ||
            [];

          if (filters && filters.length > 0 && Array.isArray(data)) {
            data = this.applyFilters(data, filters);
          }

          if (sorts && sorts.length > 0 && Array.isArray(data)) {
            data = this.applySorts(data, sorts);
          }

          return data;
        } catch (error) {
          lastError = error;
        }
      }
    }

    this.logger.error(
      `All attempts failed for ${slug}. Last error: ${lastError?.message}`,
    );
    return [];
  }

  private applyFilters(data: any[], filters: any[]) {
    return data.filter((row) => {
      for (const f of filters) {
        if (!f.field || f.value === undefined || f.value === '') continue;
        const val = row[f.field];
        const target = f.value;

        switch (f.operator) {
          case 'equals':
          case 'eq':
            if (String(val) !== String(target)) return false;
            break;
          case 'contains':
            if (
              !String(val).toLowerCase().includes(String(target).toLowerCase())
            )
              return false;
            break;
          case 'gt':
            if (Number(val) <= Number(target)) return false;
            break;
          case 'lt':
            if (Number(val) >= Number(target)) return false;
            break;
          case 'not_equal':
            if (String(val) === String(target)) return false;
            break;
        }
      }
      return true;
    });
  }

  private applySorts(data: any[], sorts: any[]) {
    return [...data].sort((a, b) => {
      for (const s of sorts) {
        if (!s.field) continue;
        const valA = a[s.field];
        const valB = b[s.field];
        if (valA === valB) continue;
        const dir = s.dir === 'desc' ? -1 : 1;
        if (valA > valB) return dir;
        if (valA < valB) return -dir;
      }
      return 0;
    });
  }
}
