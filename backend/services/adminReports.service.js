import supabase from '../config/supabase.js';

const CHART_COLORS = ['#5f6fff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short' });

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const relation = (value) => (Array.isArray(value) ? value[0] || null : value || null);

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeStatus = (value) => String(value || 'unknown').trim().toUpperCase();

const statusLabel = (value) => {
  const normalized = normalizeStatus(value).replace(/_/g, ' ').toLowerCase();
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

const dateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dayKey = (value) => {
  const date = dateValue(value);
  return date ? date.toISOString().slice(0, 10) : '';
};

const monthKey = (value) => {
  const date = dateValue(value);
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : '';
};

const getAppointmentDate = (appointment) =>
  appointment?.scheduled_at ||
  appointment?.scheduledAt ||
  appointment?.appointment_date ||
  appointment?.created_at ||
  appointment?.createdAt ||
  null;

const getPaymentDate = (payment) => payment?.paid_at || payment?.paidAt || payment?.created_at || payment?.createdAt || null;

const parseBoundary = (value, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
};

const inRange = (value, from, to) => {
  const date = dateValue(value);
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
};

const safeSelect = async (table, select, fallback = '*') => {
  const primary = await supabase.from(table).select(select);
  if (!primary.error) return primary.data || [];

  if (fallback && fallback !== select) {
    const fallbackResult = await supabase.from(table).select(fallback);
    if (!fallbackResult.error) return fallbackResult.data || [];
  }

  console.warn(`[adminReports] Failed to load ${table}:`, primary.error.message);
  return [];
};

const lastDays = (count) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - index - 1));
    return {
      key: dayKey(date),
      label: WEEKDAY_FORMATTER.format(date),
    };
  });
};

const lastMonths = (count) => {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - index - 1), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: MONTH_FORMATTER.format(date),
    };
  });
};

const countByPeriod = (items, periods, getDate) =>
  periods.map((period) => ({
    label: period.label,
    count: items.filter((item) => dayKey(getDate(item)) === period.key).length,
  }));

const sumByMonth = (items, periods, getDate, getValue) =>
  periods.map((period) =>
    items
      .filter((item) => monthKey(getDate(item)) === period.key)
      .reduce((sum, item) => sum + getValue(item), 0)
  );

const getDoctorUser = (doctor) => relation(doctor?.users) || relation(doctor?.user) || null;
const getPatientUser = (patient) => relation(patient?.users) || relation(patient?.user) || null;

const buildContextMaps = (appointments, doctors, patients, users) => {
  const doctorMap = new Map(doctors.map((doctor) => [doctor.id, doctor]));
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const userMap = new Map(users.map((user) => [user.id, user]));
  const appointmentMap = new Map(appointments.map((appointment) => [appointment.id, appointment]));

  return { doctorMap, patientMap, userMap, appointmentMap };
};

const doctorForAppointment = (appointment, doctorMap) =>
  relation(appointment?.doctor) || relation(appointment?.doctor_profile) || doctorMap.get(appointment?.doctor_id) || null;

const patientForAppointment = (appointment, patientMap) =>
  relation(appointment?.patient) || patientMap.get(appointment?.patient_id) || null;

const doctorName = (doctor) => {
  const user = getDoctorUser(doctor);
  return user?.name || user?.email || doctor?.name || doctor?.specialty || 'Doctor';
};

const patientName = (patient) => {
  const user = getPatientUser(patient);
  return user?.name || user?.email || patient?.name || 'Patient';
};

const specialtyForAppointment = (appointment, doctorMap) => {
  const doctor = doctorForAppointment(appointment, doctorMap);
  return doctor?.specialty || doctor?.speciality || doctor?.sub_specialty || 'General';
};

const appointmentPayments = (appointment, paymentsByAppointmentId) => {
  const nested = toArray(appointment?.payment || appointment?.payments);
  const linked = paymentsByAppointmentId.get(appointment?.id) || [];
  const map = new Map();
  [...nested, ...linked].forEach((payment, index) => {
    const key = payment?.id || `${appointment?.id || 'appointment'}-${index}`;
    map.set(key, payment);
  });
  return Array.from(map.values());
};

const buildPaymentCollections = (payments, appointments) => {
  const fromAppointments = appointments.flatMap((appointment) =>
    toArray(appointment?.payment || appointment?.payments).map((payment) => ({
      ...payment,
      appointment_id: payment?.appointment_id || appointment.id,
    }))
  );
  const byId = new Map();
  [...payments, ...fromAppointments].forEach((payment, index) => {
    const key = payment?.id || `${payment?.appointment_id || 'payment'}-${index}`;
    byId.set(key, payment);
  });

  const allPayments = Array.from(byId.values());
  const byAppointmentId = new Map();
  allPayments.forEach((payment) => {
    if (!payment?.appointment_id) return;
    const rows = byAppointmentId.get(payment.appointment_id) || [];
    rows.push(payment);
    byAppointmentId.set(payment.appointment_id, rows);
  });

  return { allPayments, byAppointmentId };
};

const isPaid = (payment) => ['PAID', 'COMPLETED', 'SUCCESS'].includes(normalizeStatus(payment?.status));

const buildAppointmentReport = (appointments, doctorMap, patientMap, paymentsByAppointmentId, months, days) => {
  const statusCounts = new Map();
  appointments.forEach((appointment) => {
    const status = normalizeStatus(appointment.status);
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  });

  const statusTotals = Array.from(statusCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([status, count]) => ({ label: statusLabel(status), status, count }));

  const specialtyCounts = new Map();
  appointments.forEach((appointment) => {
    const specialty = specialtyForAppointment(appointment, doctorMap);
    specialtyCounts.set(specialty, (specialtyCounts.get(specialty) || 0) + 1);
  });

  const topSpecialties = Array.from(specialtyCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([specialty]) => specialty);

  const specialtyMonthly = (topSpecialties.length ? topSpecialties : ['Appointments']).map((specialty, index) => ({
    label: specialty,
    color: CHART_COLORS[index % CHART_COLORS.length],
    labels: months.map((month) => month.label),
    values: months.map((month) =>
      appointments.filter((appointment) => {
        const matchesMonth = monthKey(getAppointmentDate(appointment)) === month.key;
        if (!topSpecialties.length) return matchesMonth;
        return matchesMonth && specialtyForAppointment(appointment, doctorMap) === specialty;
      }).length
    ),
  }));

  const rows = [...appointments]
    .sort((left, right) => dateValue(getAppointmentDate(right)) - dateValue(getAppointmentDate(left)))
    .slice(0, 10)
    .map((appointment) => {
      const doctor = doctorForAppointment(appointment, doctorMap);
      const patient = patientForAppointment(appointment, patientMap);
      const payments = appointmentPayments(appointment, paymentsByAppointmentId);
      return {
        id: appointment.id,
        date: getAppointmentDate(appointment),
        doctor: doctorName(doctor),
        patient: patientName(patient),
        specialty: specialtyForAppointment(appointment, doctorMap),
        status: statusLabel(appointment.status),
        type: appointment.reason ? 'Consultation' : 'Appointment',
        paymentStatus: payments.some(isPaid) ? 'Paid' : 'Unpaid',
      };
    });

  return {
    stats: {
      total: appointments.length,
      completed: appointments.filter((appointment) => normalizeStatus(appointment.status) === 'COMPLETED').length,
      pending: appointments.filter((appointment) => normalizeStatus(appointment.status) === 'PENDING').length,
      cancelled: appointments.filter((appointment) => normalizeStatus(appointment.status) === 'CANCELLED').length,
    },
    weeklyCounts: countByPeriod(appointments, days, getAppointmentDate),
    statusTotals,
    specialtyMonthly,
    rows,
  };
};

const buildConsultationReport = (appointments, summaries, appointmentMap, doctorMap, patientMap, paidPayments, months) => {
  const completedAppointments = appointments.filter((appointment) =>
    ['COMPLETED', 'CONFIRMED'].includes(normalizeStatus(appointment.status))
  );
  const consultationRows = summaries.length
    ? summaries.map((summary) => ({ summary, appointment: appointmentMap.get(summary.appointment_id) || relation(summary.appointment) || null }))
    : completedAppointments.map((appointment) => ({ summary: null, appointment }));

  const totalDuration = consultationRows.reduce((sum, row) => sum + toNumber(row.appointment?.duration_minutes || 30), 0);
  const completedRate = appointments.length ? Math.round((completedAppointments.length / appointments.length) * 100) : 0;
  const paidAppointmentIds = new Set(completedAppointments.map((appointment) => appointment.id));
  const revenue = paidPayments
    .filter((payment) => paidAppointmentIds.has(payment.appointment_id))
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

  const rows = consultationRows
    .sort((left, right) => {
      const leftDate = left.summary?.created_at || getAppointmentDate(left.appointment);
      const rightDate = right.summary?.created_at || getAppointmentDate(right.appointment);
      return dateValue(rightDate) - dateValue(leftDate);
    })
    .slice(0, 10)
    .map(({ summary, appointment }) => {
      const doctor = doctorForAppointment(appointment, doctorMap);
      const patient = patientForAppointment(appointment, patientMap);
      return {
        id: summary?.id || appointment?.id,
        date: summary?.created_at || getAppointmentDate(appointment),
        doctor: doctorName(doctor),
        patient: patientName(patient),
        duration: `${toNumber(appointment?.duration_minutes || 30)} min`,
        type: appointment?.meeting_link ? 'Video Call' : 'Consultation',
      };
    });

  return {
    stats: {
      total: consultationRows.length,
      avgDuration: consultationRows.length ? Math.round(totalDuration / consultationRows.length) : 0,
      completedRate,
      revenue,
    },
    monthlyTrend: [{
      label: 'Consultations',
      color: CHART_COLORS[0],
      labels: months.map((month) => month.label),
      values: months.map((month) =>
        consultationRows.filter((row) => {
          const rowDate = row.summary?.created_at || getAppointmentDate(row.appointment);
          return monthKey(rowDate) === month.key;
        }).length
      ),
    }],
    rows,
  };
};

const buildTriageReport = (triageDecisions, patientQueries, patients, days) => {
  const queryMap = new Map(patientQueries.map((query) => [query.id, query]));
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const resolvedCount = triageDecisions.filter((decision) => {
    const query = relation(decision.query) || relation(decision.patient_queries) || queryMap.get(decision.query_id);
    return Boolean(query?.is_resolved || query?.isResolved);
  }).length;
  const avgConfidence = triageDecisions.length
    ? Math.round((triageDecisions.reduce((sum, decision) => sum + toNumber(decision.confidence_score || decision.confidenceScore), 0) / triageDecisions.length) * 100)
    : 0;

  const rows = [...triageDecisions]
    .sort((left, right) => dateValue(right.created_at || right.createdAt) - dateValue(left.created_at || left.createdAt))
    .slice(0, 10)
    .map((decision) => {
      const query = relation(decision.query) || relation(decision.patient_queries) || queryMap.get(decision.query_id);
      const patient = relation(query?.patient) || patientMap.get(query?.patient_id);
      return {
        id: decision.id,
        date: decision.created_at || decision.createdAt,
        patient: patientName(patient),
        symptoms: query?.symptom_text || query?.symptomText || query?.title || 'Not recorded',
        decision: decision.recommended_specialty || decision.recommendedSpecialty || 'Doctor recommendation',
        outcome: query?.is_resolved || query?.isResolved ? 'Resolved' : 'Open',
      };
    });

  return {
    stats: {
      total: triageDecisions.length,
      resolvedRate: triageDecisions.length ? Math.round((resolvedCount / triageDecisions.length) * 100) : 0,
      avgConfidence,
      highUrgency: triageDecisions.filter((decision) => String(decision.urgency_level || decision.urgencyLevel || '').toLowerCase() === 'high').length,
    },
    weeklyCounts: countByPeriod(triageDecisions, days, (decision) => decision.created_at || decision.createdAt),
    rows,
  };
};

const buildRevenueReport = (paidPayments, appointmentMap, doctorMap, patientMap, months) => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const total = paidPayments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const thisMonth = paidPayments
    .filter((payment) => monthKey(getPaymentDate(payment)) === currentMonth)
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const lastMonth = paidPayments
    .filter((payment) => monthKey(getPaymentDate(payment)) === previousMonth)
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const growthRate = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : (thisMonth ? 100 : 0);

  const transactions = [...paidPayments]
    .sort((left, right) => dateValue(getPaymentDate(right)) - dateValue(getPaymentDate(left)))
    .slice(0, 10)
    .map((payment) => {
      const appointment = appointmentMap.get(payment.appointment_id);
      const doctor = doctorForAppointment(appointment, doctorMap);
      const patient = patientForAppointment(appointment, patientMap);
      return {
        id: payment.id,
        date: getPaymentDate(payment),
        amount: toNumber(payment.amount),
        status: statusLabel(payment.status),
        gateway: payment.gateway || 'Payment',
        doctor: doctorName(doctor),
        patient: patientName(patient),
      };
    });

  return {
    stats: {
      total,
      thisMonth,
      growthRate,
      paidCount: paidPayments.length,
    },
    monthlyTrend: [{
      label: 'Revenue',
      color: CHART_COLORS[0],
      labels: months.map((month) => month.label),
      values: sumByMonth(paidPayments, months, getPaymentDate, (payment) => toNumber(payment.amount)),
    }],
    transactions,
  };
};

const buildUserActivityReport = (users, category, from, to) => {
  const categoryRole = String(category || '').trim().toLowerCase().replace(/s$/, '');
  const roleFilter = ['patient', 'doctor', 'student', 'admin'].includes(categoryRole) ? categoryRole : null;
  const visibleUsers = roleFilter ? users.filter((user) => String(user.role || '').toLowerCase() === roleFilter) : users;
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const roleRows = ['patient', 'doctor', 'student', 'admin'].map((role) => {
    const roleUsers = visibleUsers.filter((user) => String(user.role || '').toLowerCase() === role);
    const active = roleUsers.filter((user) => user.is_active !== false && user.isActive !== false).length;
    const newInRange = roleUsers.filter((user) => {
      const created = user.created_at || user.createdAt;
      if (from || to) return inRange(created, from, to);
      return dateValue(created) >= currentMonthStart;
    }).length;

    return {
      type: role.charAt(0).toUpperCase() + role.slice(1) + (role === 'admin' ? '' : 's'),
      role,
      total: roleUsers.length,
      active,
      newMonth: newInRange,
      rate: roleUsers.length ? Math.round((active / roleUsers.length) * 100) : 0,
    };
  }).filter((row) => !roleFilter || row.role === roleFilter);

  const activeUsers = visibleUsers.filter((user) => user.is_active !== false && user.isActive !== false).length;
  const newUsers = visibleUsers.filter((user) => {
    const created = user.created_at || user.createdAt;
    if (from || to) return inRange(created, from, to);
    return dateValue(created) >= currentMonthStart;
  }).length;

  return {
    stats: {
      totalUsers: visibleUsers.length,
      activeUsers,
      newThisMonth: newUsers,
      engagementRate: visibleUsers.length ? Math.round((activeUsers / visibleUsers.length) * 100) : 0,
    },
    rows: roleRows,
  };
};

export async function buildSystemReports(query = {}) {
  const from = parseBoundary(query.from || query.dateRange || query.startDate);
  const to = parseBoundary(query.to || query.endDate, true);
  const category = query.category;

  const [
    appointmentsRaw,
    users,
    doctorsRaw,
    patients,
    students,
    paymentsRaw,
    triageRaw,
    patientQueries,
    summariesRaw,
  ] = await Promise.all([
    safeSelect(
      'appointments',
      '*, patient:patients(*, users(name,email,avatar_url)), doctor:doctor_profiles(*, users(name,email,avatar_url)), payment:payments(*)'
    ),
    safeSelect('users', 'id,name,email,role,is_active,created_at,updated_at'),
    safeSelect('doctor_profiles', '*, users(name,email,avatar_url)'),
    safeSelect('patients', '*, users(name,email,avatar_url)'),
    safeSelect('student_profiles', '*'),
    safeSelect('payments', '*'),
    safeSelect(
      'triage_decisions',
      '*, query:patient_queries(*, patient:patients(*, users(name,email,avatar_url)))'
    ),
    safeSelect('patient_queries', '*'),
    safeSelect('consultation_summaries', '*, appointment:appointments(*)'),
  ]);

  const appointments = appointmentsRaw.filter((appointment) => inRange(getAppointmentDate(appointment), from, to));
  const triageDecisions = triageRaw.filter((decision) => inRange(decision.created_at || decision.createdAt, from, to));
  const summaries = summariesRaw.filter((summary) => inRange(summary.created_at || summary.createdAt, from, to));

  const { doctorMap, patientMap, appointmentMap } = buildContextMaps(appointmentsRaw, doctorsRaw, patients, users);
  const { allPayments, byAppointmentId } = buildPaymentCollections(paymentsRaw, appointmentsRaw);
  const paidPayments = allPayments.filter((payment) => isPaid(payment) && inRange(getPaymentDate(payment), from, to));
  const months = lastMonths(12);
  const days = lastDays(7);

  return {
    generatedAt: new Date().toISOString(),
    filters: {
      from: from ? from.toISOString() : null,
      to: to ? to.toISOString() : null,
      category: category || null,
    },
    overview: {
      totalAppointments: appointments.length,
      totalConsultations: summaries.length || appointments.filter((appointment) => normalizeStatus(appointment.status) === 'COMPLETED').length,
      totalUsers: users.length,
      totalDoctors: doctorsRaw.length,
      totalPatients: patients.length,
      totalStudents: students.length,
      totalRevenue: paidPayments.reduce((sum, payment) => sum + toNumber(payment.amount), 0),
    },
    appointments: buildAppointmentReport(appointments, doctorMap, patientMap, byAppointmentId, months, days),
    consultations: buildConsultationReport(appointments, summaries, appointmentMap, doctorMap, patientMap, paidPayments, months),
    triage: buildTriageReport(triageDecisions, patientQueries, patients, days),
    revenue: buildRevenueReport(paidPayments, appointmentMap, doctorMap, patientMap, months),
    users: buildUserActivityReport(users, category, from, to),
  };
}
