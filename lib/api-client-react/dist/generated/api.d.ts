import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AppSettings, Appointment, AvailableSlots, Barber, BlockedSlot, CreateAppointmentBody, CreateBarberBody, CreateBlockedSlotBody, CreateRecurringAppointmentBody, CreateServiceBody, DashboardSummary, ErrorResponse, ExportAppointmentsParams, GetAvailableSlotsParams, HealthStatus, ListAppointmentsParams, ListBlockedSlotsParams, LoginBody, LoginResponse, RecurringAppointmentResult, RevenueChartEntry, Service, ServicesChartEntry, UpdateAppointmentBody, UpdateBarberBody, UpdateServiceBody, UpdateSettingsBody } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Get app settings
 */
export declare const getGetSettingsUrl: () => string;
export declare const getSettings: (options?: RequestInit) => Promise<AppSettings>;
export declare const getGetSettingsQueryKey: () => readonly ["/api/settings"];
export declare const getGetSettingsQueryOptions: <TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getSettings>>>;
export type GetSettingsQueryError = ErrorType<unknown>;
/**
 * @summary Get app settings
 */
export declare function useGetSettings<TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update app settings
 */
export declare const getUpdateSettingsUrl: () => string;
export declare const updateSettings: (updateSettingsBody: UpdateSettingsBody, options?: RequestInit) => Promise<AppSettings>;
export declare const getUpdateSettingsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<UpdateSettingsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<UpdateSettingsBody>;
}, TContext>;
export type UpdateSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateSettings>>>;
export type UpdateSettingsMutationBody = BodyType<UpdateSettingsBody>;
export type UpdateSettingsMutationError = ErrorType<unknown>;
/**
 * @summary Update app settings
 */
export declare const useUpdateSettings: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<UpdateSettingsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<UpdateSettingsBody>;
}, TContext>;
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all active barbershop services
 */
export declare const getListServicesUrl: () => string;
export declare const listServices: (options?: RequestInit) => Promise<Service[]>;
export declare const getListServicesQueryKey: () => readonly ["/api/services"];
export declare const getListServicesQueryOptions: <TData = Awaited<ReturnType<typeof listServices>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listServices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listServices>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListServicesQueryResult = NonNullable<Awaited<ReturnType<typeof listServices>>>;
export type ListServicesQueryError = ErrorType<unknown>;
/**
 * @summary List all active barbershop services
 */
export declare function useListServices<TData = Awaited<ReturnType<typeof listServices>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listServices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new service
 */
export declare const getCreateServiceUrl: () => string;
export declare const createService: (createServiceBody: CreateServiceBody, options?: RequestInit) => Promise<Service>;
export declare const getCreateServiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createService>>, TError, {
        data: BodyType<CreateServiceBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createService>>, TError, {
    data: BodyType<CreateServiceBody>;
}, TContext>;
export type CreateServiceMutationResult = NonNullable<Awaited<ReturnType<typeof createService>>>;
export type CreateServiceMutationBody = BodyType<CreateServiceBody>;
export type CreateServiceMutationError = ErrorType<unknown>;
/**
 * @summary Create a new service
 */
export declare const useCreateService: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createService>>, TError, {
        data: BodyType<CreateServiceBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createService>>, TError, {
    data: BodyType<CreateServiceBody>;
}, TContext>;
/**
 * @summary Update a service
 */
export declare const getUpdateServiceUrl: (id: string) => string;
export declare const updateService: (id: string, updateServiceBody: UpdateServiceBody, options?: RequestInit) => Promise<Service>;
export declare const getUpdateServiceMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateService>>, TError, {
        id: string;
        data: BodyType<UpdateServiceBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateService>>, TError, {
    id: string;
    data: BodyType<UpdateServiceBody>;
}, TContext>;
export type UpdateServiceMutationResult = NonNullable<Awaited<ReturnType<typeof updateService>>>;
export type UpdateServiceMutationBody = BodyType<UpdateServiceBody>;
export type UpdateServiceMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Update a service
 */
export declare const useUpdateService: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateService>>, TError, {
        id: string;
        data: BodyType<UpdateServiceBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateService>>, TError, {
    id: string;
    data: BodyType<UpdateServiceBody>;
}, TContext>;
/**
 * @summary Delete (deactivate) a service
 */
export declare const getDeleteServiceUrl: (id: string) => string;
export declare const deleteService: (id: string, options?: RequestInit) => Promise<void>;
export declare const getDeleteServiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteService>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteService>>, TError, {
    id: string;
}, TContext>;
export type DeleteServiceMutationResult = NonNullable<Awaited<ReturnType<typeof deleteService>>>;
export type DeleteServiceMutationError = ErrorType<unknown>;
/**
 * @summary Delete (deactivate) a service
 */
export declare const useDeleteService: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteService>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteService>>, TError, {
    id: string;
}, TContext>;
/**
 * @summary List all barbers
 */
export declare const getListBarbersUrl: () => string;
export declare const listBarbers: (options?: RequestInit) => Promise<Barber[]>;
export declare const getListBarbersQueryKey: () => readonly ["/api/barbers"];
export declare const getListBarbersQueryOptions: <TData = Awaited<ReturnType<typeof listBarbers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBarbers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listBarbers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListBarbersQueryResult = NonNullable<Awaited<ReturnType<typeof listBarbers>>>;
export type ListBarbersQueryError = ErrorType<unknown>;
/**
 * @summary List all barbers
 */
export declare function useListBarbers<TData = Awaited<ReturnType<typeof listBarbers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBarbers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new barber
 */
export declare const getCreateBarberUrl: () => string;
export declare const createBarber: (createBarberBody: CreateBarberBody, options?: RequestInit) => Promise<Barber>;
export declare const getCreateBarberMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBarber>>, TError, {
        data: BodyType<CreateBarberBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createBarber>>, TError, {
    data: BodyType<CreateBarberBody>;
}, TContext>;
export type CreateBarberMutationResult = NonNullable<Awaited<ReturnType<typeof createBarber>>>;
export type CreateBarberMutationBody = BodyType<CreateBarberBody>;
export type CreateBarberMutationError = ErrorType<unknown>;
/**
 * @summary Create a new barber
 */
export declare const useCreateBarber: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBarber>>, TError, {
        data: BodyType<CreateBarberBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createBarber>>, TError, {
    data: BodyType<CreateBarberBody>;
}, TContext>;
/**
 * @summary Get a single barber
 */
export declare const getGetBarberUrl: (id: number) => string;
export declare const getBarber: (id: number, options?: RequestInit) => Promise<Barber>;
export declare const getGetBarberQueryKey: (id: number) => readonly [`/api/barbers/${number}`];
export declare const getGetBarberQueryOptions: <TData = Awaited<ReturnType<typeof getBarber>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBarber>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBarber>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBarberQueryResult = NonNullable<Awaited<ReturnType<typeof getBarber>>>;
export type GetBarberQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a single barber
 */
export declare function useGetBarber<TData = Awaited<ReturnType<typeof getBarber>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBarber>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update a barber
 */
export declare const getUpdateBarberUrl: (id: number) => string;
export declare const updateBarber: (id: number, updateBarberBody: UpdateBarberBody, options?: RequestInit) => Promise<Barber>;
export declare const getUpdateBarberMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBarber>>, TError, {
        id: number;
        data: BodyType<UpdateBarberBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateBarber>>, TError, {
    id: number;
    data: BodyType<UpdateBarberBody>;
}, TContext>;
export type UpdateBarberMutationResult = NonNullable<Awaited<ReturnType<typeof updateBarber>>>;
export type UpdateBarberMutationBody = BodyType<UpdateBarberBody>;
export type UpdateBarberMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Update a barber
 */
export declare const useUpdateBarber: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBarber>>, TError, {
        id: number;
        data: BodyType<UpdateBarberBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateBarber>>, TError, {
    id: number;
    data: BodyType<UpdateBarberBody>;
}, TContext>;
/**
 * @summary List all blocked slots
 */
export declare const getListBlockedSlotsUrl: (params?: ListBlockedSlotsParams) => string;
export declare const listBlockedSlots: (params?: ListBlockedSlotsParams, options?: RequestInit) => Promise<BlockedSlot[]>;
export declare const getListBlockedSlotsQueryKey: (params?: ListBlockedSlotsParams) => readonly ["/api/blocked-slots", ...ListBlockedSlotsParams[]];
export declare const getListBlockedSlotsQueryOptions: <TData = Awaited<ReturnType<typeof listBlockedSlots>>, TError = ErrorType<unknown>>(params?: ListBlockedSlotsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBlockedSlots>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listBlockedSlots>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListBlockedSlotsQueryResult = NonNullable<Awaited<ReturnType<typeof listBlockedSlots>>>;
export type ListBlockedSlotsQueryError = ErrorType<unknown>;
/**
 * @summary List all blocked slots
 */
export declare function useListBlockedSlots<TData = Awaited<ReturnType<typeof listBlockedSlots>>, TError = ErrorType<unknown>>(params?: ListBlockedSlotsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBlockedSlots>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Block a time slot or full day
 */
export declare const getCreateBlockedSlotUrl: () => string;
export declare const createBlockedSlot: (createBlockedSlotBody: CreateBlockedSlotBody, options?: RequestInit) => Promise<BlockedSlot>;
export declare const getCreateBlockedSlotMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBlockedSlot>>, TError, {
        data: BodyType<CreateBlockedSlotBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createBlockedSlot>>, TError, {
    data: BodyType<CreateBlockedSlotBody>;
}, TContext>;
export type CreateBlockedSlotMutationResult = NonNullable<Awaited<ReturnType<typeof createBlockedSlot>>>;
export type CreateBlockedSlotMutationBody = BodyType<CreateBlockedSlotBody>;
export type CreateBlockedSlotMutationError = ErrorType<unknown>;
/**
 * @summary Block a time slot or full day
 */
export declare const useCreateBlockedSlot: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBlockedSlot>>, TError, {
        data: BodyType<CreateBlockedSlotBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createBlockedSlot>>, TError, {
    data: BodyType<CreateBlockedSlotBody>;
}, TContext>;
/**
 * @summary Remove a blocked slot
 */
export declare const getDeleteBlockedSlotUrl: (id: number) => string;
export declare const deleteBlockedSlot: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteBlockedSlotMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBlockedSlot>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteBlockedSlot>>, TError, {
    id: number;
}, TContext>;
export type DeleteBlockedSlotMutationResult = NonNullable<Awaited<ReturnType<typeof deleteBlockedSlot>>>;
export type DeleteBlockedSlotMutationError = ErrorType<unknown>;
/**
 * @summary Remove a blocked slot
 */
export declare const useDeleteBlockedSlot: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBlockedSlot>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteBlockedSlot>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List appointments with optional filters
 */
export declare const getListAppointmentsUrl: (params?: ListAppointmentsParams) => string;
export declare const listAppointments: (params?: ListAppointmentsParams, options?: RequestInit) => Promise<Appointment[]>;
export declare const getListAppointmentsQueryKey: (params?: ListAppointmentsParams) => readonly ["/api/appointments", ...ListAppointmentsParams[]];
export declare const getListAppointmentsQueryOptions: <TData = Awaited<ReturnType<typeof listAppointments>>, TError = ErrorType<unknown>>(params?: ListAppointmentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAppointments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAppointments>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAppointmentsQueryResult = NonNullable<Awaited<ReturnType<typeof listAppointments>>>;
export type ListAppointmentsQueryError = ErrorType<unknown>;
/**
 * @summary List appointments with optional filters
 */
export declare function useListAppointments<TData = Awaited<ReturnType<typeof listAppointments>>, TError = ErrorType<unknown>>(params?: ListAppointmentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAppointments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new appointment
 */
export declare const getCreateAppointmentUrl: () => string;
export declare const createAppointment: (createAppointmentBody: CreateAppointmentBody, options?: RequestInit) => Promise<Appointment>;
export declare const getCreateAppointmentMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAppointment>>, TError, {
        data: BodyType<CreateAppointmentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAppointment>>, TError, {
    data: BodyType<CreateAppointmentBody>;
}, TContext>;
export type CreateAppointmentMutationResult = NonNullable<Awaited<ReturnType<typeof createAppointment>>>;
export type CreateAppointmentMutationBody = BodyType<CreateAppointmentBody>;
export type CreateAppointmentMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Create a new appointment
 */
export declare const useCreateAppointment: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAppointment>>, TError, {
        data: BodyType<CreateAppointmentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAppointment>>, TError, {
    data: BodyType<CreateAppointmentBody>;
}, TContext>;
/**
 * @summary Get available time slots for a date and service
 */
export declare const getGetAvailableSlotsUrl: (params: GetAvailableSlotsParams) => string;
export declare const getAvailableSlots: (params: GetAvailableSlotsParams, options?: RequestInit) => Promise<AvailableSlots>;
export declare const getGetAvailableSlotsQueryKey: (params?: GetAvailableSlotsParams) => readonly ["/api/appointments/available-slots", ...GetAvailableSlotsParams[]];
export declare const getGetAvailableSlotsQueryOptions: <TData = Awaited<ReturnType<typeof getAvailableSlots>>, TError = ErrorType<unknown>>(params: GetAvailableSlotsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAvailableSlots>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAvailableSlots>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAvailableSlotsQueryResult = NonNullable<Awaited<ReturnType<typeof getAvailableSlots>>>;
export type GetAvailableSlotsQueryError = ErrorType<unknown>;
/**
 * @summary Get available time slots for a date and service
 */
export declare function useGetAvailableSlots<TData = Awaited<ReturnType<typeof getAvailableSlots>>, TError = ErrorType<unknown>>(params: GetAvailableSlotsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAvailableSlots>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create recurring weekly appointments within a period
 */
export declare const getCreateRecurringAppointmentsUrl: () => string;
export declare const createRecurringAppointments: (createRecurringAppointmentBody: CreateRecurringAppointmentBody, options?: RequestInit) => Promise<RecurringAppointmentResult>;
export declare const getCreateRecurringAppointmentsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createRecurringAppointments>>, TError, {
        data: BodyType<CreateRecurringAppointmentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createRecurringAppointments>>, TError, {
    data: BodyType<CreateRecurringAppointmentBody>;
}, TContext>;
export type CreateRecurringAppointmentsMutationResult = NonNullable<Awaited<ReturnType<typeof createRecurringAppointments>>>;
export type CreateRecurringAppointmentsMutationBody = BodyType<CreateRecurringAppointmentBody>;
export type CreateRecurringAppointmentsMutationError = ErrorType<unknown>;
/**
 * @summary Create recurring weekly appointments within a period
 */
export declare const useCreateRecurringAppointments: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createRecurringAppointments>>, TError, {
        data: BodyType<CreateRecurringAppointmentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createRecurringAppointments>>, TError, {
    data: BodyType<CreateRecurringAppointmentBody>;
}, TContext>;
/**
 * @summary Export appointments as CSV
 */
export declare const getExportAppointmentsUrl: (params?: ExportAppointmentsParams) => string;
export declare const exportAppointments: (params?: ExportAppointmentsParams, options?: RequestInit) => Promise<string>;
export declare const getExportAppointmentsQueryKey: (params?: ExportAppointmentsParams) => readonly ["/api/appointments/export", ...ExportAppointmentsParams[]];
export declare const getExportAppointmentsQueryOptions: <TData = Awaited<ReturnType<typeof exportAppointments>>, TError = ErrorType<unknown>>(params?: ExportAppointmentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof exportAppointments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof exportAppointments>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ExportAppointmentsQueryResult = NonNullable<Awaited<ReturnType<typeof exportAppointments>>>;
export type ExportAppointmentsQueryError = ErrorType<unknown>;
/**
 * @summary Export appointments as CSV
 */
export declare function useExportAppointments<TData = Awaited<ReturnType<typeof exportAppointments>>, TError = ErrorType<unknown>>(params?: ExportAppointmentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof exportAppointments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Delete all appointments in a recurrence group
 */
export declare const getDeleteRecurringGroupUrl: (groupId: string) => string;
export declare const deleteRecurringGroup: (groupId: string, options?: RequestInit) => Promise<void>;
export declare const getDeleteRecurringGroupMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteRecurringGroup>>, TError, {
        groupId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteRecurringGroup>>, TError, {
    groupId: string;
}, TContext>;
export type DeleteRecurringGroupMutationResult = NonNullable<Awaited<ReturnType<typeof deleteRecurringGroup>>>;
export type DeleteRecurringGroupMutationError = ErrorType<unknown>;
/**
 * @summary Delete all appointments in a recurrence group
 */
export declare const useDeleteRecurringGroup: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteRecurringGroup>>, TError, {
        groupId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteRecurringGroup>>, TError, {
    groupId: string;
}, TContext>;
/**
 * @summary Get a single appointment
 */
export declare const getGetAppointmentUrl: (id: number) => string;
export declare const getAppointment: (id: number, options?: RequestInit) => Promise<Appointment>;
export declare const getGetAppointmentQueryKey: (id: number) => readonly [`/api/appointments/${number}`];
export declare const getGetAppointmentQueryOptions: <TData = Awaited<ReturnType<typeof getAppointment>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAppointment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAppointment>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAppointmentQueryResult = NonNullable<Awaited<ReturnType<typeof getAppointment>>>;
export type GetAppointmentQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a single appointment
 */
export declare function useGetAppointment<TData = Awaited<ReturnType<typeof getAppointment>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAppointment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update an appointment (status, etc.)
 */
export declare const getUpdateAppointmentUrl: (id: number) => string;
export declare const updateAppointment: (id: number, updateAppointmentBody: UpdateAppointmentBody, options?: RequestInit) => Promise<Appointment>;
export declare const getUpdateAppointmentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAppointment>>, TError, {
        id: number;
        data: BodyType<UpdateAppointmentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateAppointment>>, TError, {
    id: number;
    data: BodyType<UpdateAppointmentBody>;
}, TContext>;
export type UpdateAppointmentMutationResult = NonNullable<Awaited<ReturnType<typeof updateAppointment>>>;
export type UpdateAppointmentMutationBody = BodyType<UpdateAppointmentBody>;
export type UpdateAppointmentMutationError = ErrorType<unknown>;
/**
 * @summary Update an appointment (status, etc.)
 */
export declare const useUpdateAppointment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAppointment>>, TError, {
        id: number;
        data: BodyType<UpdateAppointmentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateAppointment>>, TError, {
    id: number;
    data: BodyType<UpdateAppointmentBody>;
}, TContext>;
/**
 * @summary Delete an appointment
 */
export declare const getDeleteAppointmentUrl: (id: number) => string;
export declare const deleteAppointment: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteAppointmentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAppointment>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteAppointment>>, TError, {
    id: number;
}, TContext>;
export type DeleteAppointmentMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAppointment>>>;
export type DeleteAppointmentMutationError = ErrorType<unknown>;
/**
 * @summary Delete an appointment
 */
export declare const useDeleteAppointment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAppointment>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteAppointment>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Admin login
 */
export declare const getAdminLoginUrl: () => string;
export declare const adminLogin: (loginBody: LoginBody, options?: RequestInit) => Promise<LoginResponse>;
export declare const getAdminLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminLogin>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminLogin>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
export type AdminLoginMutationResult = NonNullable<Awaited<ReturnType<typeof adminLogin>>>;
export type AdminLoginMutationBody = BodyType<LoginBody>;
export type AdminLoginMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Admin login
 */
export declare const useAdminLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminLogin>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminLogin>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
/**
 * @summary Get dashboard summary stats
 */
export declare const getGetDashboardSummaryUrl: () => string;
export declare const getDashboardSummary: (options?: RequestInit) => Promise<DashboardSummary>;
export declare const getGetDashboardSummaryQueryKey: () => readonly ["/api/dashboard/summary"];
export declare const getGetDashboardSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardSummary>>>;
export type GetDashboardSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard summary stats
 */
export declare function useGetDashboardSummary<TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get daily revenue for the last 30 days
 */
export declare const getGetRevenueChartUrl: () => string;
export declare const getRevenueChart: (options?: RequestInit) => Promise<RevenueChartEntry[]>;
export declare const getGetRevenueChartQueryKey: () => readonly ["/api/dashboard/revenue-chart"];
export declare const getGetRevenueChartQueryOptions: <TData = Awaited<ReturnType<typeof getRevenueChart>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRevenueChart>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRevenueChart>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRevenueChartQueryResult = NonNullable<Awaited<ReturnType<typeof getRevenueChart>>>;
export type GetRevenueChartQueryError = ErrorType<unknown>;
/**
 * @summary Get daily revenue for the last 30 days
 */
export declare function useGetRevenueChart<TData = Awaited<ReturnType<typeof getRevenueChart>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRevenueChart>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get most sold services (count of completed appointments per service)
 */
export declare const getGetServicesChartUrl: () => string;
export declare const getServicesChart: (options?: RequestInit) => Promise<ServicesChartEntry[]>;
export declare const getGetServicesChartQueryKey: () => readonly ["/api/dashboard/services-chart"];
export declare const getGetServicesChartQueryOptions: <TData = Awaited<ReturnType<typeof getServicesChart>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getServicesChart>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getServicesChart>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetServicesChartQueryResult = NonNullable<Awaited<ReturnType<typeof getServicesChart>>>;
export type GetServicesChartQueryError = ErrorType<unknown>;
/**
 * @summary Get most sold services (count of completed appointments per service)
 */
export declare function useGetServicesChart<TData = Awaited<ReturnType<typeof getServicesChart>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getServicesChart>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get tomorrow's pending appointments for reminder sending
 */
export declare const getGetDashboardRemindersUrl: () => string;
export declare const getDashboardReminders: (options?: RequestInit) => Promise<Appointment[]>;
export declare const getGetDashboardRemindersQueryKey: () => readonly ["/api/dashboard/reminders"];
export declare const getGetDashboardRemindersQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardReminders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardReminders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardReminders>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardRemindersQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardReminders>>>;
export type GetDashboardRemindersQueryError = ErrorType<unknown>;
/**
 * @summary Get tomorrow's pending appointments for reminder sending
 */
export declare function useGetDashboardReminders<TData = Awaited<ReturnType<typeof getDashboardReminders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardReminders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map