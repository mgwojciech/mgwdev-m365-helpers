export interface IProvisioningService<T> {
    provision(resource: T): Promise<T>;
}