export interface BookingBusiness {
  id: string;
  slug: string;
  name: string;
  currency: string;
  timezone: string;
}

export interface BookingService {
  id: string;
  businessId: string;
  name: string;
  duration: number;
  price: number;
}

export interface BookingProfessional {
  id: string;
  businessId: string;
  name: string;
}

export interface BookingAvailabilityQuery {
  businessId: string;
  professionalId: string;
  date: string;
  timeZone: string;
  serviceDurationMinutes: number;
}

export interface AtomicBookingInput {
  id: string;
  businessId: string;
  serviceId: string;
  professionalId: string;
  clientName: string;
  clientWhatsApp: string;
  dateTime: string;
  serviceDurationMinutes: number;
}

export interface BookingRepository {
  findBusinessBySlug(slug: string): Promise<BookingBusiness | null>;
  findServiceById(serviceId: string): Promise<BookingService | null>;
  findProfessionalById(professionalId: string): Promise<BookingProfessional | null>;
  getAvailableSlots(query: BookingAvailabilityQuery): Promise<string[]>;
  insertIfAvailable(input: AtomicBookingInput): Promise<boolean>;
}
