import client from '../../../services/http/client';
import {ENDPOINTS} from '../../../services/http/endpoints';
import type {
  EventsListResponse,
  EventDetailResponse,
  CreateEventPayload,
  RegisterEventResponse,
  MyEventsResponse,
} from '../../../types/auth';

export async function listEventsApi(params?: {
  search?: string;
  category?: string;
  city?: string;
  tribeId?: string;
  dateFilter?: 'today' | 'weekend' | 'week' | 'all';
  page?: number;
  limit?: number;
}): Promise<EventsListResponse> {
  const {data} = await client.get<EventsListResponse>(ENDPOINTS.EVENTS, {params});
  return data;
}

export async function getEventDetailApi(slug: string): Promise<EventDetailResponse> {
  const {data} = await client.get<EventDetailResponse>(`${ENDPOINTS.EVENTS}/${slug}`);
  return data;
}

export async function createEventApi(payload: CreateEventPayload): Promise<EventDetailResponse> {
  const {data} = await client.post<EventDetailResponse>(ENDPOINTS.EVENTS, payload);
  return data;
}

export async function registerEventApi(eventId: string): Promise<RegisterEventResponse> {
  const {data} = await client.post<RegisterEventResponse>(
    `${ENDPOINTS.EVENTS}/${eventId}/register`,
  );
  return data;
}

export async function unregisterEventApi(eventId: string): Promise<{message: string}> {
  const {data} = await client.delete<{message: string}>(
    `${ENDPOINTS.EVENTS}/${eventId}/register`,
  );
  return data;
}

export async function getMyEventsApi(): Promise<MyEventsResponse> {
  const {data} = await client.get<MyEventsResponse>(ENDPOINTS.EVENTS_MY);
  return data;
}

export async function updateEventApi(
  eventId: string,
  payload: Partial<CreateEventPayload>,
): Promise<EventDetailResponse> {
  const {data} = await client.patch<EventDetailResponse>(
    `${ENDPOINTS.EVENTS}/${eventId}`,
    payload,
  );
  return data;
}

export async function deleteEventApi(eventId: string): Promise<{message: string}> {
  const {data} = await client.delete<{message: string}>(`${ENDPOINTS.EVENTS}/${eventId}`);
  return data;
}
