import { Assignment, AssignmentStatus, AssignmentType, AssignmentPriority, Student, Writer, WriterDashboardData } from '../types';

const API_URL = '/api'; // Relative path since we'll serve from the same origin or use proxy

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

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
  // Transform frontend writer format to backend format
  const backendWriter: any = {
    name: writer.name,
    phone: writer.contact || '', // Map frontend 'contact' to backend 'phone' (backend will auto-generate if invalid)
    specialty: writer.specialty || null,
    isFlagged: writer.isFlagged || false,
    rating: writer.rating || { quality: 5.0, punctuality: 5.0, communication: 5.0, reliability: 5.0, count: 1 },
    availabilityStatus: writer.availabilityStatus || 'available',
    maxConcurrentTasks: writer.maxConcurrentTasks || 5,
    email: writer.contact && writer.contact.includes('@') ? writer.contact : null,
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

export const deleteWriter = async (id: string) => {
  const response = await fetch(`${API_URL}/writers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete writer');
};

export const rateWriter = async (writerId: string, quality: number, punctuality: number) => {
  // Calculate average rating
  const rating = (quality + punctuality) / 2;

  // Update the writer's rating on the backend
  const response = await fetch(`${API_URL}/writers/${writerId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating })
  });

  if (!response.ok) throw new Error('Failed to rate writer');

  return response.json();
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
  // Track status changes for history
  if (assignment.id) {
    const existingAssignments = await getAssignments();
    const existing = existingAssignments.find(a => a.id === assignment.id);

    if (existing && existing.status !== assignment.status) {
      // Initialize statusHistory if it doesn't exist
      if (!assignment.statusHistory) {
        assignment.statusHistory = existing.statusHistory || [];
      }
      assignment.statusHistory.push({
        timestamp: new Date().toISOString(),
        from: existing.status,
        to: assignment.status,
        note: ''
      });
    }

    // Track payment changes
    if (existing) {
      // Initialize paymentHistory if it doesn't exist
      if (!assignment.paymentHistory) {
        assignment.paymentHistory = existing.paymentHistory || [];
      }

      // Check for incoming payment change
      if (existing.paidAmount !== assignment.paidAmount && assignment.paidAmount > existing.paidAmount) {
        assignment.paymentHistory.push({
          date: new Date().toISOString(),
          amount: assignment.paidAmount - existing.paidAmount,
          type: 'incoming',
          method: 'Manual Entry',
          notes: 'Payment recorded'
        });
      }

      // Check for outgoing payment change
      if (existing.writerPaidAmount !== assignment.writerPaidAmount && (assignment.writerPaidAmount || 0) > (existing.writerPaidAmount || 0)) {
        assignment.paymentHistory.push({
          date: new Date().toISOString(),
          amount: (assignment.writerPaidAmount || 0) - (existing.writerPaidAmount || 0),
          type: 'outgoing',
          method: 'Manual Entry',
          notes: 'Payment to writer'
        });
      }
    }
  }

  if (!assignment.id) {
    assignment.activityLog = [{
      timestamp: new Date().toISOString(),
      user: 'System',
      action: 'created',
      details: 'Assignment created'
    }];
    assignment.statusHistory = [{
      timestamp: new Date().toISOString(),
      from: AssignmentStatus.PENDING,
      to: assignment.status || AssignmentStatus.PENDING,
      note: 'Initial status'
    }];
    const response = await fetch(`${API_URL}/assignments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(assignment),
    });
    if (!response.ok) throw new Error('Failed to create assignment');
    return response.json();
  } else {
    const response = await fetch(`${API_URL}/assignments/${assignment.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(assignment),
    });
    if (!response.ok) throw new Error('Failed to update assignment');
    return response.json();
  }
};

export const deleteAssignment = async (id: string) => {
  const response = await fetch(`${API_URL}/assignments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete assignment');
};

export const getDashboardStats = async () => {
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

    // Check if this is the original backup format
    if (data.students && data.writers && data.assignments) {
      // This is a backup file, we need to convert it
      console.log('Converting backup data format...');

      // Convert students - ensure required fields aren't empty
      const convertedStudents = data.students.map((student: any) => ({
        id: student.id,
        name: student.name || 'Unknown',
        email: student.email || 'unknown@example.com',
        phone: student.phone || '0000000000',
        university: student.university,
        remarks: student.remarks,
        isFlagged: student.isFlagged || false,
        referredBy: student.referredBy,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      })).filter((student: any) => student.name && student.email && student.phone);

      // Create a mapping of old writer IDs to new indices for later use
      const writerIdMap: Record<string, number> = {};
      data.writers.forEach((writer: any, index: number) => {
        writerIdMap[writer.id] = index + 1;
      });

      // Convert writers - ensure phone numbers are valid and ratings are numbers
      const convertedWriters = data.writers.map((writer: any, index: number) => {
        // Extract phone number from contact if it's a phone number
        let phone = '';
        if (writer.contact && /^\d+$/.test(writer.contact)) {
          phone = writer.contact;
        } else {
          // Generate a unique dummy phone number if contact isn't a valid phone
          phone = `9${Date.now().toString().slice(-9)}`;
        }

        // Ensure phone is exactly 10 digits
        if (phone.length !== 10) {
          // Take last 10 digits or pad with zeros
          phone = phone.replace(/\D/g, '').slice(-10).padStart(10, '0');
          if (phone.length > 10) {
            phone = phone.substring(0, 10);
          } else if (phone.length < 10) {
            phone = phone.padEnd(10, '0');
          }
        }

        // Convert rating structure
        let rating = 0;
        if (writer.rating && typeof writer.rating === 'object') {
          // Average of quality and punctuality
          const quality = parseFloat(writer.rating.quality) || 0;
          const punctuality = parseFloat(writer.rating.punctuality) || 0;
          rating = (quality + punctuality) / 2;
        } else if (typeof writer.rating === 'number') {
          rating = writer.rating;
        } else if (typeof writer.rating === 'string') {
          rating = parseFloat(writer.rating) || 0;
        }

        // Ensure rating is a valid number
        if (isNaN(rating)) {
          rating = 0;
        }

        return {
          phone: phone,
          name: writer.name || 'Unknown Writer',
          email: writer.contact && writer.contact.includes('@') ? writer.contact : 'unknown@example.com',
          rating: rating,
          totalAssignments: 0,
          completedAssignments: 0,
          onTimeDeliveries: 0,
          level: 'Bronze',
          points: 0,
          streak: 0,
          lastActive: writer.updatedAt || writer.createdAt || new Date().toISOString(),
          createdAt: writer.createdAt,
          updatedAt: writer.updatedAt
        };
      }).filter((writer: any) => writer.name && writer.phone);

      // Convert assignments - map old writer IDs to new ones
      const convertedAssignments = data.assignments.map((assignment: any) => {
        // Map string status to proper enum values if needed
        let status = assignment.status;
        // Map string type to proper enum values if needed
        let type = assignment.type;
        // Map string priority to proper enum values if needed
        let priority = assignment.priority;

        // Map old writer IDs to new temporary IDs (we'll fix this on the backend)
        let writerId = assignment.writerId;

        return {
          id: assignment.id,
          studentId: assignment.studentId,
          writerId: writerId,
          title: assignment.title,
          type: type,
          subject: assignment.subject,
          level: assignment.level,
          deadline: assignment.deadline,
          status: status,
          priority: priority,
          documentLink: assignment.documentLink,
          wordCount: assignment.wordCount || 0,
          costPerWord: assignment.costPerWord || 0,
          writerCostPerWord: assignment.writerCostPerWord || 0,
          price: assignment.price,
          paidAmount: assignment.paidAmount,
          writerPrice: assignment.writerPrice || 0,
          writerPaidAmount: assignment.writerPaidAmount || 0,
          sunkCosts: assignment.sunkCosts || 0,
          isDissertation: assignment.isDissertation,
          totalChapters: assignment.totalChapters,
          chapters: assignment.chapters,
          description: assignment.description,
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt,
          activityLog: [],
          paymentHistory: [],
          statusHistory: [],
          attachments: []
        };
      });

      // Use individual API endpoints instead of bulk-import to avoid datatype issues
      console.log(`Importing ${convertedStudents.length} students...`);
      for (const student of convertedStudents) {
        try {
          await fetch(`${API_URL}/students`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(student),
          });
        } catch (error) {
          console.warn(`Failed to import student ${student.id}:`, error);
        }
      }

      console.log(`Importing ${convertedWriters.length} writers...`);
      for (const writer of convertedWriters) {
        try {
          await fetch(`${API_URL}/writers`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(writer),
          });
        } catch (error) {
          console.warn(`Failed to import writer:`, error);
        }
      }

      console.log(`Importing ${convertedAssignments.length} assignments...`);
      for (const assignment of convertedAssignments) {
        try {
          await fetch(`${API_URL}/assignments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(assignment),
          });
        } catch (error) {
          console.warn(`Failed to import assignment ${assignment.id}:`, error);
        }
      }

      console.log('Import completed successfully!');
      return true;
    } else {
      // This is already in the correct format, use bulk import
      if (!data.students || !data.writers || !data.assignments) {
        throw new Error("Invalid data format");
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
        const errorText = await response.text();
        console.error('Import error response:', errorText);
        throw new Error(`Import failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Import successful:', result);
      return true;
    }
  } catch (e) {
    console.error("Import failed", e);
    return false;
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