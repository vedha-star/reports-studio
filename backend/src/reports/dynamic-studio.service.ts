/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
 
 
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

interface RawEndpoint {
  slug?: string;
  name?: string;
  endPoint?: string;
}

@Injectable()
export class DynamicStudioService {
  private readonly logger = new Logger(DynamicStudioService.name);

  private readonly baseUrl = process.env.DYNAMIC_STUDIO_URL || 'https://query.navacle.com/api/v1';
  private readonly apiPrefix = '/dynamic-rest';

  private readonly user = process.env.DYNAMIC_STUDIO_USER || 'admin';
  private readonly pass = process.env.DYNAMIC_STUDIO_PASS || 'admin123';

  async getEndpoints() {
    const urls = [
      `${this.baseUrl}${this.apiPrefix}/query-list`.replace(/([^:]\/)\/+/g, "$1"),
      'https://query-framework-backend.onrender.com/api/v1/dynamic-rest/query-list',
    ];

    // EXACT names found in the API that match the user's 26 working list
    const ALLOWED_SLUGS = [
      'my-enquiries', 'classrooms', 'school-settings', 'subjects', 'teachers',
      'class-details', 'academic-years', 'audience-types', 'event-types', 'grades',
      'syllabus-frameworks', 'tenants', 'follow-up-enquiry', 'applications', 
      'users', 'enquiry-status-summary', 'vp_fee_by_branch', 'follow_ups_stats', 
      'escalate_enquiries', 'student-list', 'dir_filter_overdue_fee_list',
      'admin-enquiries-kpi', 'dir_filter_payment_modes', 'dir_filter_performance_status',
      'admin_tour_stats_overview', 'academic'
    ];

    for (const url of urls) {
      try {
        console.log(`--- DEBUG: FETCHING ENDPOINTS FROM ${url} ---`);
        const response = await axios.get(url, {
          auth: { username: this.user, password: this.pass },
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          timeout: 5000 
        });
        
        console.log(`STATUS: ${response.status} - SUCCESS`);
        const rawData = response.data;
        let endpoints: any[] = [];
        
        if (Array.isArray(rawData)) endpoints = rawData;
        else if (rawData && Array.isArray(rawData.data)) endpoints = rawData.data;
        else if (rawData && Array.isArray(rawData.results)) endpoints = rawData.results;

        // Filter for ONLY the 26 specified working endpoints
        return (endpoints as RawEndpoint[]).filter((ep) => {
          const s = (ep.slug || ep.name || ep.endPoint || '').toLowerCase();
          return ALLOWED_SLUGS.includes(s);
        });

      } catch (error) {
        console.error(`--- DEBUG: LIST FETCH FAILED FOR ${url}: ${error.message} ---`);
      }
    }

    this.logger.error('All attempts to fetch query list failed.');
    return [];
  }

  async runQuery(
    slug: string,
    parameters: any = {},
    dbCode: string = 'erp',
    filters: any[] = [],
    sorts: any[] = [],
  ) {
    const ALLOWED_SLUGS = [
      'my-enquiries', 'classrooms', 'school-settings', 'subjects', 'teachers',
      'class-details', 'academic-years', 'audience-types', 'event-types', 'grades',
      'syllabus-frameworks', 'tenants', 'follow-up-enquiry', 'applications', 
      'users', 'enquiry-status-summary', 'vp_fee_by_branch', 'follow_ups_stats', 
      'escalate_enquiries', 'student-list', 'dir_filter_overdue_fee_list',
      'admin-enquiries-kpi', 'dir_filter_payment_modes', 'dir_filter_performance_status',
      'admin_tour_stats_overview', 'academic'
    ];

    const cleanSlug = (slug || '').trim().toLowerCase();
    
    // Safety check: Block any endpoint not in the approved list
    if (!ALLOWED_SLUGS.includes(cleanSlug)) {
      this.logger.warn(`Blocked attempt to run unauthorized endpoint: ${cleanSlug}`);
      return [];
    }

    
    // Define exact URLs to try - Simplified to prevent memory issues
    const attempts = [
      {
        url: `${this.baseUrl}${this.apiPrefix}/search/${cleanSlug}`.replace(/([^:]\/)\/+/g, "$1"),
        method: 'POST'
      },
      {
        url: `https://query-framework-backend.onrender.com/api/v1/dynamic-rest/search/${cleanSlug}`,
        method: 'POST'
      }
    ];

    // FLATTEN PARAMETERS: Always ensure it is a simple object
    let flatParams: any = {};
    try {
      if (Array.isArray(parameters)) {
        parameters.forEach(p => {
          if (p && p.name) flatParams[p.name] = p.value;
        });
      } else if (typeof parameters === 'object' && parameters !== null) {
        flatParams = { ...parameters };
      }

      // Ensure a high pageSize for the result set if not specified
      if (!flatParams.pageSize && !flatParams.limit && !flatParams.size) {
        flatParams.pageSize = 2000;
      }
    } catch (e) {
      console.error('Flattening error:', e);
    }

    let lastError: any = null;

    for (const attempt of attempts) {
      try {
        console.log(`--- DEBUG: ATTEMPTING ${attempt.method} ---`);
        console.log(`URL: ${attempt.url}`);
        console.log(`PAYLOAD:`, JSON.stringify(flatParams));

        const config: AxiosRequestConfig = {
          auth: { username: this.user, password: this.pass },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'x-db-identifier': dbCode.toLowerCase().split('_')[0], // Extract 'erp' from 'erp_prod'
            'x-user-context': JSON.stringify({ tenantId: '1', branchId: null }),
          },
        };

        const response = await axios.post(attempt.url, flatParams, config);

        console.log(`--- DEBUG: SUCCESS ---`);
        console.log(`STATUS: ${response.status}`);

        // Robust data extraction: Find the largest array in the response
        let data: any[] = [];
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Check common keys first
          const commonData = response.data.data || response.data.results || response.data.items || [];
          data = Array.isArray(commonData) ? commonData : [];
          
          // Then scan all keys to see if there's a larger array (e.g. 1083 records vs 4 summary records)
          let maxLen = data.length;
          for (const key in response.data) {
            const val = response.data[key];
            if (Array.isArray(val) && val.length > maxLen) {
              data = val;
              maxLen = val.length;
            }
          }
        }

        this.logger.log(`Query execution for ${cleanSlug} returned ${data.length} records.`);
        if (data.length > 0 && data.length <= 10) {
           this.logger.debug(`Data sample for ${cleanSlug}: ${JSON.stringify(data.slice(0, 3))}`);
        }

        if (filters && filters.length > 0 && Array.isArray(data)) {
          data = this.applyFilters(data, filters);
        }
        if (sorts && sorts.length > 0 && Array.isArray(data)) {
          data = this.applySorts(data, sorts);
        }

        return data;
      } catch (error) {
        console.error(`--- DEBUG: FAILED ---`);
        console.error(`URL: ${attempt.url}`);
        console.error(`ERROR: ${error.response?.status} - ${error.message}`);
        lastError = error;
      }
    }

    this.logger.error(`Execution failed for ${cleanSlug}: ${lastError?.response?.status || lastError?.message}`);
    return [];
  }

  private applyFilters(data: any[], filters: any[]) {
    return data.filter((row) => {
      for (const f of filters) {
        if (!f.field || f.value === undefined || f.value === '') continue;
        const val = row[f.field];
        const target = f.value;
        switch (f.operator) {
          case 'equals': case 'eq': if (String(val) !== String(target)) return false; break;
          case 'contains': if (!String(val).toLowerCase().includes(String(target).toLowerCase())) return false; break;
          case 'gt': if (Number(val) <= Number(target)) return false; break;
          case 'lt': if (Number(val) >= Number(target)) return false; break;
          case 'not_equal': if (String(val) === String(target)) return false; break;
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

        // Handle nulls/undefined - push to end
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (valA === valB) continue;

        const dir = s.dir === 'desc' ? -1 : 1;

        // Try numeric comparison if both are numbers or numeric strings
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA > numB ? dir : -dir;
        }

        // Case-insensitive string comparison
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        
        if (strA > strB) return dir;
        if (strA < strB) return -dir;
      }
      return 0;
    });
  }
}
