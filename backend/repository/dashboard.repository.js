import { supabase } from '../config/supabase.js';

// ─── Patient lookup ───────────────────────────────────────────────────────────

async function findPatientByUserId(userId) {
  const { data, error } = await supabase
    .from('patients')
    .select('*, user:users(id,name,email,avatarUrl:avatar_url)')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ─── Dashboard overview ───────────────────────────────────────────────────────

async function getUpcomingAppointmentsCount(patientId) {
  const now = new Date().toISOString();
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact' })
    .eq('patient_id', patientId)
    .gte('scheduled_at', now)
    .in('status', ['pending', 'confirmed']);
  if (error) throw error;
  return count || 0;
}

async function getPendingTestsCount(patientId) {
  // IoT readings submitted in last 7 days without a result score = "pending"
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { count, error } = await supabase
    .from('iot_readings')
    .select('*', { count: 'exact' })
    .eq('patient_id', patientId)
    .is('result_score', null)
    .gte('recorded_at', sevenDaysAgo.toISOString());
  if (error) throw error;
  return count || 0;
}

async function getLatestPrescriptions(patientId, take = 3) {
  const { data, error } = await supabase
    .from('consultation_summaries')
    .select(`id,prescription,diagnosis,created_at:createdAt, appointment:appointments(id,scheduled_at:scheduledAt, doctor:doctor_profiles(id,specialty, user:users(name,avatarUrl:avatar_url)))`)
    .not('prescription', 'is', null)
    .order('created_at', { ascending: false })
    .limit(take);
  if (error) throw error;
  return data;
}

// Health score: computed from profile completeness + recent vitals
async function getHealthScoreData(patientId) {
  const { data, error } = await supabase
    .from('patients')
    .select(`height,weight,blood_group:bondGroup,blood_group: "bloodGroup", gender, date_of_birth:dateOfBirth, allergies, chronic_conditions:chronicConditions, current_medications:currentMedications, medical_history:medicalHistory, emergency_contacts:emergency_contacts(id), address_info:patient_addresses(id)`) 
    .eq('id', patientId)
    .maybeSingle();
  if (error) throw error;
  // fetch recent iot readings separately
  const { data: iot, error: iotErr } = await supabase
    .from('iot_readings')
    .select('result_score:resultScore,test_type: testType,recorded_at:recordedAt')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false })
    .limit(5);
  if (iotErr) throw iotErr;
  return { ...data, iotReadings: iot };
}

// ─── Appointments ─────────────────────────────────────────────────────────────

async function getUpcomingAppointments(patientId, { page = 1, limit = 10 } = {}) {
  const now = new Date().toISOString();
  const offset = (page - 1) * limit;
  const base = supabase
    .from('appointments')
    .select(`*, doctor:doctor_profiles(id,specialty,consultation_fee:consultationFee, user:users(name,avatarUrl:avatar_url)), consultation_summary:consultation_summaries(diagnosis,prescription,follow_up_date:followUpDate), payment:payments(status,amount,currency)`, { count: 'exact' })
    .eq('patient_id', patientId)
    .gte('scheduled_at', now)
    .in('status', ['pending', 'confirmed'])
    .order('scheduled_at', { ascending: true })
    .range(offset, offset + limit - 1);
  const { data, count, error } = await base;
  if (error) throw error;
  return { total: count || 0, page, limit, appointments: data };
}

async function getAllAppointments(patientId, { page = 1, limit = 10, status } = {}) {
  const offset = (page - 1) * limit;
  let query = supabase
    .from('appointments')
    .select(`*, doctor:doctor_profiles(id,specialty,consultation_fee:consultationFee,is_verified:isVerified, user:users(name,avatarUrl:avatar_url,email,phone)), consultation_summary:consultation_summaries(*), payment:payments(status,amount,currency,paid_at:paidAt)`, { count: 'exact' })
    .eq('patient_id', patientId)
    .order('scheduled_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) throw error;
  return { total: count || 0, page, limit, appointments: data };
}

async function findAppointmentById(id, patientId) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`*, doctor:doctor_profiles(id,specialty,sub_specialty:subSpecialty,consultation_fee:consultationFee,experience_years:experienceYears,bio,is_verified:isVerified, user:users(name,avatarUrl:avatar_url,email,phone)), consultation_summary:consultation_summaries(*), payment:payments(*), anonymized_case:anonymized_cases(id,specialty_tag:specialtyTag,is_approved:isApproved)`) 
    .eq('id', id)
    .eq('patient_id', patientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function bookAppointment(data) {
  const { data: created, error } = await supabase
    .from('appointments')
    .insert(data)
    .select('*, doctor:doctor_profiles(id,specialty, user:users(name,avatarUrl:avatar_url))')
    .maybeSingle();
  if (error) throw error;
  return created;
}

async function cancelAppointment(id) {
  const { data: updated, error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id).maybeSingle();
  if (error) throw error;
  return updated;
}

async function updateAppointment(id, data) {
  const { data: updated, error } = await supabase.from('appointments').update(data).eq('id', id).maybeSingle();
  if (error) throw error;
  return updated;
}

// ─── Medical history ──────────────────────────────────────────────────────────

async function getMedicalHistory(patientId, { page = 1, limit = 10 } = {}) {
  const offset = (page - 1) * limit;
  const { data, count, error } = await supabase
    .from('appointments')
    .select(`*, doctor:doctor_profiles(specialty, user:users(name,avatarUrl:avatar_url)), consultation_summary:consultation_summaries(ai_summary:aiSummary,doctor_notes:doctorNotes,diagnosis,prescription,follow_up_date:followUpDate,created_at:createdAt)`, { count: 'exact' })
    .eq('patient_id', patientId)
    .eq('status', 'completed')
    .not('consultation_summary', 'is', null)
    .order('scheduled_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return { total: count || 0, page, limit, records: data };
}

async function getRecentMedicalHistory(patientId, take = 3) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`*, doctor:doctor_profiles(specialty, user:users(name,avatarUrl:avatar_url)), consultation_summary:consultation_summaries(diagnosis,prescription,follow_up_date:followUpDate,created_at:createdAt)`) 
    .eq('patient_id', patientId)
    .eq('status', 'completed')
    .not('consultation_summary', 'is', null)
    .order('scheduled_at', { ascending: false })
    .limit(take);
  if (error) throw error;
  return data;
}

// ─── IoT readings ─────────────────────────────────────────────────────────────

async function getIotReadings(patientId, { page = 1, limit = 10, testType } = {}) {
  const offset = (page - 1) * limit;
  let query = supabase.from('iot_readings').select('*', { count: 'exact' }).eq('patient_id', patientId).order('recorded_at', { ascending: false });
  if (testType) query = query.eq('test_type', testType);
  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) throw error;
  return { total: count || 0, page, limit, readings: data };
}

async function getRecentIotReadings(patientId, take = 3) {
  const { data, error } = await supabase.from('iot_readings').select('*').eq('patient_id', patientId).order('recorded_at', { ascending: false }).limit(take);
  if (error) throw error;
  return data;
}

async function findIotReadingById(id, patientId) {
  const { data, error } = await supabase.from('iot_readings').select('*').eq('id', id).eq('patient_id', patientId).maybeSingle();
  if (error) throw error;
  return data;
}

async function createIotReading(data) {
  const { data: created, error } = await supabase.from('iot_readings').insert(data).select().maybeSingle();
  if (error) throw error;
  return created;
}

// ─── Patient queries ──────────────────────────────────────────────────────────

async function getPatientQueries(patientId, { page = 1, limit = 10, isResolved } = {}) {
  const offset = (page - 1) * limit;
  let query = supabase
    .from('patient_queries')
    .select(`*, responses:query_responses(id,response_text:responseText,is_accepted:isAccepted,created_at:createdAt, doctor:doctor_profiles(specialty, user:users(name,avatarUrl:avatar_url) )), triage_decision:triage_decisions(* )`, { count: 'exact' })
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  if (isResolved !== undefined) query = query.eq('is_resolved', isResolved);
  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) throw error;
  return { total: count || 0, page, limit, queries: data };
}

async function findQueryById(id, patientId) {
  const { data, error } = await supabase
    .from('patient_queries')
    .select(`*, responses:query_responses(id,response_text:responseText,is_accepted:isAccepted,created_at:createdAt, doctor:doctor_profiles(id,specialty,is_verified:isVerified, user:users(name,avatarUrl:avatar_url) )), triage_decision:triage_decisions(*)`)
    .eq('id', id)
    .eq('patient_id', patientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getCommunityQueries({ page = 1, limit = 10, isResolved } = {}) {
  const offset = (page - 1) * limit;
  let query = supabase
    .from('patient_queries')
    .select(`id,title,symptom_text:symptomText,is_anonymous:isAnonymous,is_resolved:isResolved,view_count:viewCount,created_at:createdAt,updated_at:updatedAt,patient:patients(user:users(name,avatarUrl:avatar_url)),responses:query_responses(id,response_text:responseText,is_accepted:isAccepted,created_at:createdAt,doctor:doctor_profiles(id,specialty,is_verified:isVerified,user:users(name,avatarUrl:avatar_url))),triage_decision:triage_decisions(*)`, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (isResolved !== undefined) query = query.eq('is_resolved', isResolved);

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) throw error;
  return { total: count || 0, page, limit, queries: data };
}

async function findCommunityQueryById(id) {
  const { data, error } = await supabase
    .from('patient_queries')
    .select(`id,title,symptom_text:symptomText,is_anonymous:isAnonymous,is_resolved:isResolved,view_count:viewCount,created_at:createdAt,updated_at:updatedAt,patient:patients(user:users(name,avatarUrl:avatar_url)),responses:query_responses(id,response_text:responseText,is_accepted:isAccepted,created_at:createdAt,doctor:doctor_profiles(id,specialty,is_verified:isVerified,user:users(name,avatarUrl:avatar_url))),triage_decision:triage_decisions(*)`)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function createQuery(data) {
  const { data: created, error } = await supabase.from('patient_queries').insert(data).select().maybeSingle();
  if (error) throw error;
  return created;
}

async function createQueryResponse(data) {
  const { data: created, error } = await supabase.from('query_responses').insert(data).select().maybeSingle();
  if (error) throw error;
  return created;
}

async function updateQuery(id, data) {
  const { data: updated, error } = await supabase.from('patient_queries').update(data).eq('id', id).maybeSingle();
  if (error) throw error;
  return updated;
}

async function deleteQuery(id) {
  const { data, error } = await supabase.from('patient_queries').delete().eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function incrementQueryView(id) {
  // Read current view_count then increment
  const { data: existing, error: getErr } = await supabase.from('patient_queries').select('view_count').eq('id', id).maybeSingle();
  if (getErr) throw getErr;
  const current = (existing && existing.view_count) || 0;
  const { data: updated, error } = await supabase.from('patient_queries').update({ view_count: current + 1 }).eq('id', id).maybeSingle();
  if (error) throw error;
  return updated;
}

// ─── Doctors (for booking) ────────────────────────────────────────────────────

async function getAvailableDoctors({ page = 1, limit = 10, specialty } = {}) {
  const offset = (page - 1) * limit;
  let query = supabase
    .from('doctor_profiles')
    .select('id,specialty,sub_specialty:subSpecialty,experience_years:experienceYears,consultation_fee:consultationFee,bio,is_verified:isVerified, user:users(name,avatarUrl:avatar_url,email) ', { count: 'exact' })
    .eq('is_available', true)
    .eq('is_verified', true)
    .order('id', { ascending: true });
  if (specialty) query = query.ilike('specialty', `%${specialty}%`);
  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) throw error;
  return { total: count || 0, page, limit, doctors: data };
}

async function findDoctorById(id) {
  const { data, error } = await supabase
    .from('doctor_profiles')
    .select('id,specialty,sub_specialty:subSpecialty,experience_years:experienceYears,consultation_fee:consultationFee,bio,qualifications,is_verified:isVerified,is_available:isAvailable, user:users(name,avatarUrl:avatar_url,email)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export default {
  findPatientByUserId,
  // overview
  getUpcomingAppointmentsCount,
  getPendingTestsCount,
  getLatestPrescriptions,
  getHealthScoreData,
  // appointments
  getUpcomingAppointments,
  getAllAppointments,
  findAppointmentById,
  bookAppointment,
  cancelAppointment,
  updateAppointment,
  // medical history
  getMedicalHistory,
  getRecentMedicalHistory,
  // iot
  getIotReadings,
  getRecentIotReadings,
  findIotReadingById,
  createIotReading,
  // queries
  getPatientQueries,
  findQueryById,
  getCommunityQueries,
  findCommunityQueryById,
  createQuery,
  createQueryResponse,
  updateQuery,
  deleteQuery,
  incrementQueryView,
  // doctors
  getAvailableDoctors,
  findDoctorById,
};