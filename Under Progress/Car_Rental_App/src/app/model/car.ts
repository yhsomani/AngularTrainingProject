export interface CarModel {
    id?: string;
    make: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
    mileage: number;
    price: number;
    available: boolean;
    transmission: 'manual' | 'automatic';
    fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    category: 'economy' | 'luxury' | 'suv' | 'sports';
    imageUrl?: string;
    lastMaintenanceDate?: Date;
    features?: string[];
}
