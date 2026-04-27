import type {
  BaseRecord,
  CreateParams,
  CrudFilter,
  CrudSort,
  DataProvider,
  DeleteOneParams,
  GetListParams,
  GetOneParams,
  UpdateParams,
} from '@refinedev/core';
import api from '@/lib/api';

const resourceEndpointMap: Record<string, string> = {
  cv: '/cv',
  profile: '/profile',
  admin: '/admin/dashboard',
  'admin-users': '/admin/users',
  'admin-moderation': '/admin/content-moderation',
  'admin-system-health': '/admin/system-health',
};

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window === 'undefined' ? 'http://localhost:4000/api' : '/api');

function resolveEndpoint(resource: string, meta?: Record<string, unknown>) {
  if (typeof meta?.endpoint === 'string') {
    return meta.endpoint;
  }

  return resourceEndpointMap[resource] ?? `/${resource}`;
}

function appendSorters(params: URLSearchParams, sorters?: CrudSort[]) {
  sorters?.forEach((sorter, index) => {
    params.append(`sort[${index}][field]`, sorter.field);
    params.append(`sort[${index}][order]`, sorter.order);
  });
}

function appendFilters(params: URLSearchParams, filters?: CrudFilter[]) {
  filters?.forEach((filter, index) => {
    if (!('field' in filter)) {
      return;
    }

    params.append(`filter[${index}][field]`, filter.field);
    params.append(`filter[${index}][operator]`, filter.operator);

    if (Array.isArray(filter.value)) {
      filter.value.forEach((value) => {
        params.append(`filter[${index}][value][]`, String(value));
      });
      return;
    }

    if (filter.value !== undefined && filter.value !== null) {
      params.append(`filter[${index}][value]`, String(filter.value));
    }
  });
}

function buildListParams({ pagination, sorters, filters }: GetListParams) {
  const params = new URLSearchParams();

  if (pagination?.currentPage) {
    params.set('page', String(pagination.currentPage));
  }

  if (pagination?.pageSize) {
    params.set('limit', String(pagination.pageSize));
  }

  appendSorters(params, sorters);
  appendFilters(params, filters);

  return params;
}

function normalizeListPayload<TData extends BaseRecord>(payload: unknown) {
  if (Array.isArray(payload)) {
    return {
      data: payload as TData[],
      total: payload.length,
    };
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'items' in payload &&
    Array.isArray((payload as { items: unknown[] }).items)
  ) {
    const typed = payload as { items: TData[]; meta?: { total?: number } };

    return {
      data: typed.items,
      total: typed.meta?.total ?? typed.items.length,
    };
  }

  return {
    data: [],
    total: 0,
  };
}

export const refineDataProvider: DataProvider = {
  getList: async <TData extends BaseRecord = BaseRecord>(
    params: GetListParams,
  ) => {
    const { resource, pagination, sorters, filters, meta } = params;
    const endpoint = resolveEndpoint(resource, meta);
    const searchParams = buildListParams({ resource, pagination, sorters, filters, meta });
    const queryString = searchParams.toString();
    const response = await api.get<{ data: unknown }>(
      queryString ? `${endpoint}?${queryString}` : endpoint,
    );

    return normalizeListPayload<TData>(response.data.data);
  },
  getOne: async <TData extends BaseRecord = BaseRecord>({
    resource,
    id,
    meta,
  }: GetOneParams) => {
    const endpoint = resolveEndpoint(resource, meta);
    const url = endpoint === '/profile' ? endpoint : `${endpoint}/${id}`;
    const response = await api.get<{ data: TData }>(url);

    return {
      data: response.data.data,
    };
  },
  create: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({
    resource,
    variables,
    meta,
  }: CreateParams<TVariables>) => {
    const endpoint = resolveEndpoint(resource, meta);
    const response = await api.post<{ data: TData }>(endpoint, variables);

    return {
      data: response.data.data,
    };
  },
  update: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({
    resource,
    id,
    variables,
    meta,
  }: UpdateParams<TVariables>) => {
    const endpoint = resolveEndpoint(resource, meta);
    const url = endpoint === '/profile' ? endpoint : `${endpoint}/${id}`;
    const response = await api.patch<{ data: TData }>(url, variables);

    return {
      data: response.data.data,
    };
  },
  deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({
    resource,
    id,
    meta,
  }: DeleteOneParams<TVariables>) => {
    const endpoint = resolveEndpoint(resource, meta);
    const response = await api.delete<{ data: TData }>(`${endpoint}/${id}`);

    return {
      data: response.data.data,
    };
  },
  getApiUrl: () => apiUrl,
  custom: async ({ url, method, payload, query, headers }) => {
    const response = await api.request({
      url,
      method,
      data: payload,
      params: query,
      headers,
    });

    return {
      data: response.data?.data ?? response.data,
    };
  },
};
