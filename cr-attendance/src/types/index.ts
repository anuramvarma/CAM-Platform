export interface Student {
    id: string; // roll number is unique enough, so can use as ID or separate
    rollNumber: string;
    name: string; // Optional or placeholder
    type: 'REGULAR' | 'LATERAL';
}

export interface Subject {
    id: string;
    name: string;
}

export interface AttendanceRecord {
    id: string;
    date: string; // ISO Date string YYYY-MM-DD
    subjectId: string;
    period: string; // "1", "2"
    session: 'MORNING' | 'AFTERNOON'; // or custom
    absentees: string[]; // List of Roll Numbers who are absent
    permissions: string[]; // List of Roll Numbers with permission
}

export interface Permission {
    id: string;
    studentRoll: string;
    startDate: string;
    endDate: string;
    type: 'FULL_DAY' | 'MORNING' | 'AFTERNOON' | 'CUSTOM';
    customPeriods?: number[]; // [1, 2, 3] etc.
    reason: string;
    approvedBy?: string;
    letterFileUrl?: string | null;
}

export interface PendingPermission {
    id: string;
    classId: string;
    studentRoll: string;
    startDate: string;
    endDate: string;
    type: 'FULL_DAY' | 'MORNING' | 'AFTERNOON' | 'CUSTOM';
    customPeriods?: number[];
    reason: string;
    hasPermissionLetter: boolean;
    letterFileUrl?: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AppSettings {
    year?: string; // 1, 2, 3, 4
    batch?: string; // e.g., 23
    collegeCode?: string; // e.g., PA
    branchCode?: string; // e.g., 05 (CSE) -- implicit in roll
    isSetupComplete: boolean;
    isApproved?: boolean;
    pin?: string;
    className?: string;
}

export interface PaymentEvent {
    id: string;
    eventName: string;
    amountPerHead: number;
    description?: string;
    isActive: boolean;
    paidCount: number;
    totalCollected: number;
    createdAt: string;
}

export interface PaymentRecord {
    id: string;
    eventId: string;
    studentRoll: string;
    isPaid: boolean;
    paidAmount: number;
    paidAt?: string;
}
