import client from '../../../services/http/client';
import {ENDPOINTS} from '../../../services/http/endpoints';
import type {
  TribesListResponse,
  TribeDetailResponse,
  JoinTribeResponse,
  LeaveTribeResponse,
  MyTribesResponse,
  CreateTribePayload,
  TribePostsResponse,
  CreateTribePostPayload,
  CreateTribePostResponse,
} from '../../../types/auth';

export async function listTribesApi(params?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<TribesListResponse> {
  const {data} = await client.get<TribesListResponse>(ENDPOINTS.TRIBES, {
    params,
  });
  return data;
}

export async function getTribeDetailApi(
  slug: string,
): Promise<TribeDetailResponse> {
  const {data} = await client.get<TribeDetailResponse>(
    `${ENDPOINTS.TRIBES}/${slug}`,
  );
  return data;
}

export async function joinTribeApi(
  tribeId: string,
): Promise<JoinTribeResponse> {
  const {data} = await client.post<JoinTribeResponse>(
    `${ENDPOINTS.TRIBES}/${tribeId}/join`,
  );
  return data;
}

export async function leaveTribeApi(
  tribeId: string,
): Promise<LeaveTribeResponse> {
  const {data} = await client.delete<LeaveTribeResponse>(
    `${ENDPOINTS.TRIBES}/${tribeId}/leave`,
  );
  return data;
}

export async function getMyTribesApi(): Promise<MyTribesResponse> {
  const {data} = await client.get<MyTribesResponse>(ENDPOINTS.TRIBES_MY);
  return data;
}

export async function createTribeApi(
  payload: CreateTribePayload,
): Promise<TribeDetailResponse> {
  const {data} = await client.post<TribeDetailResponse>(
    ENDPOINTS.TRIBES,
    payload,
  );
  return data;
}

export async function listTribePostsApi(
  tribeId: string,
): Promise<TribePostsResponse> {
  const {data} = await client.get<TribePostsResponse>(
    `${ENDPOINTS.TRIBES}/${tribeId}/posts`,
  );
  return data;
}

export async function createTribePostApi(
  tribeId: string,
  payload: CreateTribePostPayload,
): Promise<CreateTribePostResponse> {
  const {data} = await client.post<CreateTribePostResponse>(
    `${ENDPOINTS.TRIBES}/${tribeId}/posts`,
    payload,
  );
  return data;
}
