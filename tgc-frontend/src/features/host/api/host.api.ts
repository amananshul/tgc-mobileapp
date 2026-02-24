import client from '../../../services/http/client';
import {ENDPOINTS} from '../../../services/http/endpoints';
import type {HostEnableResponse} from '../../../types/auth';

export async function enableHostApi(): Promise<HostEnableResponse> {
  const {data} = await client.post<HostEnableResponse>(ENDPOINTS.HOST_ENABLE);
  return data;
}
