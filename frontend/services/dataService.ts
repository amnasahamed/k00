import { getAuthHeaders } from '../api/client';
import { Assignment, AssignmentStatus, AssignmentPriority, Student, Writer, WriterDashboardData } from '../types';

const API_URL = '/api'; // Relative path since we'll serve from the same origin or use proxy

// --- Students ---

export const getStudents = async (): Promise<Student[]> => {
  const response = await fetch(`${API_URL}/students`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch students');
  return response.json();
};

export const saveStudent = async (student: Student): Promise<Student> => {
  // Let the backend generate the ID for new students
  if (!student.id) {
    const response = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(student),
    });
    if (!response.ok) throw new Error('Failed to create student');
    return response.json();
  } else {
    const response = await fetch(`${API_URL}/students/${student.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(student),
    });
    if (!response.ok) throw new Error('Failed to update student');
    return response.json();
  }
};

export const deleteStudent = async (id: string) => {
  const response = await fetch(`${API_URL}/students/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete student');
};

// --- Writers ---

export const getWriters = async (): Promise<Writer[]> => {
  const response = await fetch(`${API_URL}/writers`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch writers');
  const writers = await response.json();

  // Transform backend writer format to frontend format
  return writers.map((w: any) => ({
    id: w.id,
    name: w.name,
    contact: w.phone || '', // Map backend 'phone' to frontend 'contact'
    specialty: w.specialty || 'General',
    isFlagged: w.isFlagged || false,
    rating: w.rating && typeof w.rating === 'object' ? w.rating : {
      quality: typeof w.rating === 'number' ? w.rating : 5.0,
      punctuality: 5.0,
      communication: 5.0,
      reliability: 5.0,
      count: w.totalAssignments || 1
    },
    availabilityStatus: w.availabilityStatus || 'available',
    maxConcurrentTasks: w.maxConcurrentTasks || 5,
    performanceMetrics: {
      avgTurnaroundDays: 0,
      revisionRate: 0,
      completedTasks: w.completedAssignments || 0
    }
  }));
};

export const saveWriter = async (writer: Writer): Promise<Writer> => {
  // Transform frontend writer format to backend format.
  // `contact` is a phone number — do NOT mirror it into `email` when it
  // happens to look like one; the backend stores both as separate fields
  // and a phone-shaped value with an `@` would corrupt both records.
  const phone = (writer.contact || '').replace(/\D/g, '');
  const backendWriter: any = {
    name: writer.name,
    phone: phone || '',
    specialty: writer.specialty || null,
    isFlagged: writer.isFlagged || false,
    rating: writer.rating || { quality: 5.0, punctuality: 5.0, communication: 5.0, reliability: 5.0, count: 1 },
    availabilityStatus: writer.availabilityStatus || 'available',
    maxConcurrentTasks: writer.maxConcurrentTasks || 5,
    email: null,
    lastActive: new Date().toISOString()
  };

  const transformResponse = (result: any): Writer => ({
    id: result.id,
    name: result.name,
    contact: result.phone || '',
    specialty: result.specialty || 'General',
    isFlagged: result.isFlagged || false,
    rating: result.rating && typeof result.rating === 'object' ? result.rating : {
      quality: 5.0,
      punctuality: 5.0,
      communication: 5.0,
      reliability: 5.0,
      count: 1
    },
    availabilityStatus: result.availabilityStatus || 'available',
    maxConcurrentTasks: result.maxConcurrentTasks || 5,
    performanceMetrics: {
      avgTurnaroundDays: 0,
      revisionRate: 0,
      completedTasks: result.completedAssignments || 0
    }
  });

  if (!writer.id) {
    const response = await fetch(`${API_URL}/writers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendWriter),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create writer');
    }
    const result = await response.json();
    return transformResponse(result);
  } else {
    const response = await fetch(`${API_URL}/writers/${writer.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendWriter),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update writer');
    }
    const result = await response.json();
    return transformResponse(result);
  }
};

export const deleteWriter = async (id: string | number) => {
  const response = await fetch(`${API_URL}/writers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete writer');
};

export const rateWriter = async (writerId: string | number, quality: number, punctuality: number) => {
  const response = await fetch(`${API_URL}/writers/${writerId}/rate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ quality, punctuality }),
  });
  if (response.ok) return response.json();

  // Fallback for older backends without the rate endpoint
  const getResponse = await fetch(`${API_URL}/writers/${writerId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!getResponse.ok) throw new Error('Failed to load writer for rating');
  const current = await getResponse.json();
  const prior = (current.rating && typeof current.rating === 'object') ? current.rating : {
    quality: 5.0, punctuality: 5.0, communication: 5.0, reliability: 5.0, count: 0
  };
  const newCount = (prior.count || 0) + 1;
  const rating = {
    quality: ((prior.quality || 5) * (prior.count || 0) + quality) / newCount,
    punctuality: ((prior.punctuality || 5) * (prior.count || 0) + punctuality) / newCount,
    communication: prior.communication || 5.0,
    reliability: prior.reliability || 5.0,
    count: newCount
  };

  const putResponse = await fetch(`${API_URL}/writers/${writerId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ rating })
  });
  if (!putResponse.ok) throw new Error('Failed to rate writer');

  return putResponse.json();
};

export const getWriterDashboardData = async (writerId: number | string): Promise<WriterDashboardData> => {
  const response = await fetch(`${API_URL}/writer-dashboard/dashboard/${writerId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch dashboard data');
  return response.json();
};

export const getLeaderboard = async (): Promise<{ name: string, totalEarnings: number }[]> => {
  const response = await fetch(`${API_URL}/writer-dashboard/leaderboard`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
};

// --- Assignments ---

export const getAssignments = async (): Promise<Assignment[]> => {
  const response = await fetch(`${API_URL}/assignments`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch assignments');
  const assignments = await response.json();

  // Ensure fields exist for legacy data (or in this case, just type safety)
  return assignments.map((a: any) => ({
    ...a,
    priority: a.priority || AssignmentPriority.MEDIUM,
    writerPrice: a.writerPrice || 0,
    writerPaidAmount: a.writerPaidAmount || 0,
    sunkCosts: a.sunkCosts || 0,
    wordCount: a.wordCount || 0,
    costPerWord: a.costPerWord || 0,
    writerCostPerWord: a.writerCostPerWord || 0,
    createdAt: a.createdAt || new Date().toISOString(),
    activityLog: a.activityLog || [],
    paymentHistory: a.paymentHistory || [],
    statusHistory: a.statusHistory || [],
    attachments: a.attachments || []
  }));
};

export const getAssignmentsByStudent = async (studentId: string): Promise<Assignment[]> => {
  const assignments = await getAssignments();
  return assignments.filter(a => a.studentId === studentId);
};

export const saveAssignment = async (assignment: Assignment): Promise<Assignment> => {
  // History (status/payment/activity) is appended by the backend on create/update.
  if (!assignment.id) {
    const response = await fetch(`${API_URL}/assignments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(assignment),
    });
    if (!response.ok) throw new Error('Failed to create assignment');
    return response.json();
  }

  const response = await fetch(`${API_URL}/assignments/${assignment.id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(assignment),
  });
  if (!response.ok) throw new Error('Failed to update assignment');
  return response.json();
};

export const deleteAssignment = async (id: string) => {
  const response = await fetch(`${API_URL}/assignments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete assignment');
};

export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_URL}/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    if (response.ok) {
      return response.json();
    }
  } catch {
    // Fall through to client-side aggregation for older backends
  }

  const assignments = await getAssignments();
  const now = new Date();

  const totalPending = assignments.filter(a => a.status !== AssignmentStatus.COMPLETED && a.status !== AssignmentStatus.CANCELLED).length;

  const totalOverdue = assignments.filter(a => {
    return new Date(a.deadline) < now && a.status !== AssignmentStatus.COMPLETED;
  }).length;

  const pendingAmount = assignments.reduce((sum, a) => sum + (a.price - a.paidAmount), 0);
  const pendingWriterPay = assignments.reduce((sum, a) => sum + ((a.writerPrice || 0) - (a.writerPaidAmount || 0)), 0);

  const activeDissertations = assignments.filter(a => a.isDissertation && a.status !== AssignmentStatus.COMPLETED).length;

  return { totalPending, totalOverdue, pendingAmount, pendingWriterPay, activeDissertations };
};

// --- Data Management (Backup/Restore) ---
// These might need to be adjusted or removed if we don't want to support full JSON dump/restore via API yet.
// For now, I'll comment them out or implement a basic version if needed, but the prompt didn't explicitly ask for backup/restore migration.
// I'll leave them as placeholders or simple fetchers if possible, but `getExportData` would need to fetch everything.

export const getExportData = async () => {
  const [students, writers, assignments] = await Promise.all([
    getStudents(),
    getWriters(),
    getAssignments()
  ]);

  return {
    students,
    writers,
    assignments,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
};

export const importData = async (jsonString: string) => {
  try {
    const data = JSON.parse(jsonString);

    // Schema Check & Transformation logic
    if (data.students && data.writers && data.assignments) {
      // Basic check for legacy vs current version
      const isLegacy = !data.version || data.version === '1.0';

      if (isLegacy && data.students.length > 0 && !data.students[0].universityId) {
        console.log('Legacy data detected, applying transformations...');
        // Perform legacy transformations if needed here or on backend
      }

      // Use the bulk import endpoint
      const response = await fetch(`${API_URL}/bulk-import`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          students: data.students,
          writers: data.writers,
          assignments: data.assignments
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Import failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Import successful:', result);
      return true;
    } else {
      throw new Error("Invalid data format: Missing core collections");
    }
  } catch (e: any) {
    console.error("Import failed:", e);
    throw e;
  }
};

export const clearAllData = async () => {
  try {
    const response = await fetch(`${API_URL}/clear-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to clear data');
    }

    console.log('All data cleared successfully');
    window.location.reload();
  } catch (e) {
    console.error('Clear all data failed', e);
    throw e;
  }
};