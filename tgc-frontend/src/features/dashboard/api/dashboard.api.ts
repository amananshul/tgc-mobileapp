import client from '../../../services/http/client';
import {ENDPOINTS} from '../../../services/http/endpoints';
import type {DashboardResponse} from '../../../types/auth';

export async function getDashboardApi(): Promise<DashboardResponse> {
  const {data} = await client.get<DashboardResponse>(ENDPOINTS.DASHBOARD);
  return data;
}
