// import { createFileRoute, useNavigate } from '@tanstack/react-router';
// import { useState } from 'react';
// import { Calendar, Users } from 'lucide-react';
// import { useQuery } from '@tanstack/react-query';
// import { _axios } from '@/lib/axios';

// export const Route = createFileRoute('/batches/attendance/$batchId')({
//   component: BatchAttendance,
// });

// function BatchAttendance() {
//   const navigate = useNavigate();
//   const { batchId } = Route.useParams();
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [selectedDate, setSelectedDate] = useState<any>(null);
//   const [sessionType, setSessionType] = useState('CLASS');
//   const [reason, setReason] = useState('');
//   const [attendance, setAttendance]: any = useState({});
//   const [saving, setSaving] = useState(false);
//   const year = currentDate.getFullYear();
//   const month = currentDate.getMonth() + 1;

//   const { data: sessionsData } = useQuery({
//     queryKey: ['attendanceSessions', batchId, year, month],
//     queryFn: async () => {
//       const res = await _axios.get(
//         `/attendance/sessions?batchId=${batchId}&year=${year}&month=${month}`,
//       );
//       return res.data;
//     },
//   });

//   const { data: studentsData } = useQuery({
//     queryKey: ['batchStudents', batchId],
//     queryFn: async () => {
//       const res = await _axios.get(
//         `/attendance/students-list?batchId=${batchId}`,
//       );
//       return res.data;
//     },
//   });

//   console.log(studentsData);

//   const formatDate = (date: any) => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   };

//   const getDaysInMonth = () => {
//     const year = currentDate.getFullYear();
//     const month = currentDate.getMonth();
//     const firstDay = new Date(year, month, 1);
//     const lastDay = new Date(year, month + 1, 0);
//     const daysInMonth = lastDay.getDate();
//     const startingDayOfWeek = firstDay.getDay();

//     return { daysInMonth, startingDayOfWeek };
//   };

//   const handleDateClick = (day: any) => {
//     const clickedDate = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       day,
//     );
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     if (clickedDate > today) return;

//     const dateStr = formatDate(clickedDate);
//     const session = sessionsData?.sessions[dateStr];

//     // If CLASS session exists with attendance, navigate to view/edit page
//     if (session && session.sessionType === 'CLASS2') {
//       // navigate({
//       //   to: '/batches/attendance/$view/$sessionDate',
//       //   params: { view: batchId, sessionDate: dateStr },
//       // });
//     } else {
//       // Otherwise, open form to mark new attendance
//       setSelectedDate(clickedDate);
//       if (session) {
//         setSessionType(session.sessionType.toLowerCase());
//         setReason(session.reason || '');
//       } else {
//         setSessionType('CLASS');
//         setReason('');
//         const initialAttendance: any = {};
//         studentsData?.students?.forEach((student: any) => {
//           initialAttendance[student._id] = 'ABSENT';
//         });
//         setAttendance(initialAttendance);
//       }
//     }
//   };

//   const toggleAttendance = (studentId: any) => {
//     if (sessionType !== 'CLASS') return;

//     setAttendance((prev: any) => ({
//       ...prev,
//       [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT',
//     }));
//   };

//   const handleSubmit = async () => {
//     if (!selectedDate) return;

//     setSaving(true);

//     try {
//       const dateStr = formatDate(selectedDate);

//       const payload = {
//         batchId,
//         sessionDate: dateStr,
//         sessionType: sessionType.toUpperCase(),
//         reason: sessionType !== 'CLASS' ? reason : undefined,
//         records:
//           sessionType === 'CLASS'
//             ? studentsData?.students?.map((student: any) => ({
//                 studentId: student._id,
//                 status: attendance[student._id] || 'ABSENT',
//               }))
//             : undefined,
//       };

//       await _axios.post('/attendance/mark', payload);
//       alert('Attendance saved successfully!');
//       setSelectedDate(null);
//       setAttendance({});
//       setReason('');
//       setSessionType('CLASS');
//     } catch (error) {
//       console.error('Error saving attendance:', error);
//       alert('Failed to save attendance');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const getSessionColor = (dateStr: any) => {
//     const session = sessionsData?.sessions[dateStr];
//     if (!session) return '';

//     switch (session.sessionType) {
//       case 'CLASS':
//         return 'bg-green-100 border-green-400';
//       case 'HOLIDAY':
//         return 'bg-red-100 border-red-400';
//       case 'CANCELLED':
//         return 'bg-yellow-100 border-yellow-400';
//       default:
//         return '';
//     }
//   };

//   const renderCalendar = () => {
//     const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
//     const days = [];
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     for (let i = 0; i < startingDayOfWeek; i++) {
//       days.push(
//         <div key={`empty-${i}`} className="h-24 border border-gray-200"></div>,
//       );
//     }

//     for (let day = 1; day <= daysInMonth; day++) {
//       const date = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth(),
//         day,
//       );
//       const dateStr = formatDate(date);
//       const isFuture = date > today;
//       const sessionColor = getSessionColor(dateStr);
//       const session = sessionsData?.sessions[dateStr];

//       days.push(
//         <div
//           key={day}
//           onClick={() => !isFuture && handleDateClick(day)}
//           className={`h-24 border border-gray-300 p-2 ${
//             isFuture
//               ? 'bg-gray-100 cursor-not-allowed opacity-50'
//               : 'cursor-pointer hover:bg-gray-50'
//           } ${sessionColor} transition-colors`}>
//           <div className="font-semibold text-sm">{day}</div>
//           {session && (
//             <div className="mt-1">
//               <div className="text-xs font-medium">
//                 {session.sessionType === 'CLASS' && '✓ Class'}
//                 {session.sessionType === 'HOLIDAY' && '🎉 Holiday'}
//                 {session.sessionType === 'CANCELLED' && '✗ Cancelled'}
//               </div>
//               {session.reason && (
//                 <div className="text-xs text-gray-600 truncate">
//                   {session.reason}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>,
//       );
//     }

//     return days;
//   };

//   const changeMonth = (offset: any) => {
//     setCurrentDate(
//       new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1),
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center gap-3">
//               <Calendar className="w-8 h-8 text-blue-600" />
//               <h1 className="text-2xl font-bold text-gray-800">
//                 Batch Attendance
//               </h1>
//             </div>
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={() => changeMonth(-1)}
//                 className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
//                 Previous
//               </button>
//               <span className="text-lg font-semibold">
//                 {currentDate.toLocaleDateString('en-US', {
//                   month: 'long',
//                   year: 'numeric',
//                 })}
//               </span>
//               <button
//                 onClick={() => changeMonth(1)}
//                 className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
//                 Next
//               </button>
//             </div>
//           </div>

//           <div className="grid grid-cols-7 gap-2 mb-2">
//             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
//               <div
//                 key={day}
//                 className="text-center font-semibold text-gray-700 py-2">
//                 {day}
//               </div>
//             ))}
//           </div>

//           <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>

//           <div className="mt-6 flex gap-4 text-sm">
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 bg-green-100 border border-green-400"></div>
//               <span>Class</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 bg-red-100 border border-red-400"></div>
//               <span>Holiday</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 bg-yellow-100 border border-yellow-400"></div>
//               <span>Cancelled</span>
//             </div>
//           </div>
//         </div>

//         {selectedDate && (
//           <div className="bg-white rounded-lg shadow-lg p-6">
//             <div className="flex items-center justify-between mb-6">
//               <div>
//                 <h2 className="text-xl font-bold text-gray-800">
//                   Mark Attendance -{' '}
//                   {selectedDate.toLocaleDateString('en-US', {
//                     weekday: 'long',
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric',
//                   })}
//                 </h2>
//               </div>
//               <button
//                 onClick={() => setSelectedDate(null)}
//                 className="px-4 py-2 text-gray-600 hover:text-gray-800">
//                 Close
//               </button>
//             </div>

//             <div className="mb-6">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Session Type
//               </label>
//               <div className="flex gap-4">
//                 <label className="flex items-center gap-2">
//                   <input
//                     type="radio"
//                     value="CLASS"
//                     checked={sessionType === 'CLASS'}
//                     onChange={(e) => setSessionType(e.target.value)}
//                     className="w-4 h-4"
//                   />
//                   <span>Class</span>
//                 </label>
//                 <label className="flex items-center gap-2">
//                   <input
//                     type="radio"
//                     value="HOLIDAY"
//                     checked={sessionType === 'HOLIDAY'}
//                     onChange={(e) => setSessionType(e.target.value)}
//                     className="w-4 h-4"
//                   />
//                   <span>Holiday</span>
//                 </label>
//                 <label className="flex items-center gap-2">
//                   <input
//                     type="radio"
//                     value="CANCELLED"
//                     checked={sessionType === 'CANCELLED'}
//                     onChange={(e) => setSessionType(e.target.value)}
//                     className="w-4 h-4"
//                   />
//                   <span>Cancelled</span>
//                 </label>
//               </div>
//             </div>

//             {sessionType !== 'CLASS' && (
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Reason
//                 </label>
//                 <input
//                   type="text"
//                   value={reason}
//                   onChange={(e) => setReason(e.target.value)}
//                   placeholder="Enter reason for holiday/cancellation"
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//             )}

//             {sessionType === 'CLASS' && (
//               <div className="mb-6">
//                 <div className="flex items-center gap-2 mb-4">
//                   <Users className="w-5 h-5 text-gray-600" />
//                   <h3 className="text-lg font-semibold">
//                     Students ({studentsData?.students?.length})
//                   </h3>
//                 </div>

//                 <div className="space-y-2 max-h-96 overflow-y-auto">
//                   {studentsData?.students?.map((student: any) => (
//                     <div
//                       key={student._id}
//                       onClick={() => toggleAttendance(student._id)}
//                       className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
//                         attendance[student._id] === 'PRESENT'
//                           ? 'bg-green-50 border-green-500'
//                           : 'bg-red-50 border-red-500'
//                       }`}>
//                       <div className="flex items-center gap-3">
//                         <div
//                           className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
//                             attendance[student._id] === 'PRESENT'
//                               ? 'bg-green-500 border-green-500'
//                               : 'bg-white border-gray-300'
//                           }`}>
//                           {attendance[student._id] === 'PRESENT' && (
//                             <span className="text-white text-sm">✓</span>
//                           )}
//                         </div>
//                         <div>
//                           <div className="font-medium text-gray-800">
//                             {student.studentName}
//                           </div>
//                           <div className="text-sm text-gray-600">
//                             {student.studentPhoneNumber}
//                           </div>
//                         </div>
//                       </div>
//                       <div
//                         className={`px-3 py-1 rounded-full text-sm font-medium ${
//                           attendance[student._id] === 'PRESENT'
//                             ? 'bg-green-500 text-white'
//                             : 'bg-red-500 text-white'
//                         }`}>
//                         {attendance[student._id] === 'PRESENT'
//                           ? 'Present'
//                           : 'Absent'}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             <div className="flex justify-end gap-4">
//               <button
//                 onClick={() => setSelectedDate(null)}
//                 className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSubmit}
//                 disabled={saving || (sessionType !== 'CLASS' && !reason)}
//                 className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
//                 {saving ? 'Saving...' : 'Save Attendance'}
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// import { createFileRoute, useNavigate } from '@tanstack/react-router';
// import { useState } from 'react';
// import { Calendar, Users } from 'lucide-react';
// import { useQuery } from '@tanstack/react-query';
// import { _axios } from '@/lib/axios';
// import { toast } from 'sonner';

// export const Route = createFileRoute('/batches/attendance/$batchId')({
//   component: BatchAttendance,
// });

// function BatchAttendance() {
//   const navigate = useNavigate();
//   const { batchId } = Route.useParams();
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [selectedDate, setSelectedDate] = useState<any>(null);
//   const [sessionType, setSessionType] = useState('CLASS');
//   const [reason, setReason] = useState('');
//   const [attendance, setAttendance]: any = useState({});
//   const [saving, setSaving] = useState(false);
//   const year = currentDate.getFullYear();
//   const month = currentDate.getMonth() + 1;

//   const { data: sessionsData, refetch: refetchSessions } = useQuery({
//     queryKey: ['attendanceSessions', batchId, year, month],
//     queryFn: async () => {
//       const res = await _axios.get(
//         `/attendance/sessions?batchId=${batchId}&year=${year}&month=${month}`,
//       );
//       return res.data;
//     },
//   });

//   const { data: studentsData, refetch: refetchStudents } = useQuery({
//     queryKey: ['batchStudents', batchId],
//     queryFn: async () => {
//       const res = await _axios.get(
//         `/attendance/students-list?batchId=${batchId}`,
//       );
//       return res.data;
//     },
//   });

//   console.log(studentsData);

//   const formatDate = (date: any) => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   };

//   const getDaysInMonth = () => {
//     const year = currentDate.getFullYear();
//     const month = currentDate.getMonth();
//     const firstDay = new Date(year, month, 1);
//     const lastDay = new Date(year, month + 1, 0);
//     const daysInMonth = lastDay.getDate();
//     const startingDayOfWeek = firstDay.getDay();

//     return { daysInMonth, startingDayOfWeek };
//   };

//   const fetchAttendanceRecords = async (sessionDate: string) => {
//     try {
//       const res = await _axios.get(
//         `/attendance/records?batchId=${batchId}&sessionDate=${sessionDate}`,
//       );
//       return res.data;
//     } catch (error) {
//       console.error('Error fetching attendance records:', error);
//       return null;
//     }
//   };

//   const handleDateClick = async (day: any) => {
//     const clickedDate = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       day,
//     );
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     if (clickedDate > today) return;

//     const dateStr = formatDate(clickedDate);
//     const session = sessionsData?.sessions[dateStr];

//     // If CLASS session exists, fetch existing attendance records
//     if (session && session.sessionType === 'CLASS') {
//       const recordsData = await fetchAttendanceRecords(dateStr);

//       if (recordsData?.records && recordsData.records.length > 0) {
//         // Populate attendance state with existing records
//         const existingAttendance: any = {};
//         recordsData.records.forEach((record: any) => {
//           existingAttendance[record.studentId] = record.status;
//         });

//         // Fill in any missing students as ABSENT
//         studentsData?.students?.forEach((student: any) => {
//           if (!existingAttendance[student._id]) {
//             existingAttendance[student._id] = 'ABSENT';
//           }
//         });

//         setAttendance(existingAttendance);
//       } else {
//         // No records found, initialize with ABSENT
//         const initialAttendance: any = {};
//         studentsData?.students?.forEach((student: any) => {
//           initialAttendance[student._id] = 'ABSENT';
//         });
//         setAttendance(initialAttendance);
//       }

//       setSelectedDate(clickedDate);
//       setSessionType('CLASS');
//       setReason('');
//     } else if (session) {
//       // Non-CLASS session (HOLIDAY/CANCELLED)
//       setSelectedDate(clickedDate);
//       setSessionType(session.sessionType);
//       setReason(session.reason || '');
//     } else {
//       // No session exists, create new
//       setSelectedDate(clickedDate);
//       setSessionType('CLASS');
//       setReason('');
//       const initialAttendance: any = {};
//       studentsData?.students?.forEach((student: any) => {
//         initialAttendance[student._id] = 'ABSENT';
//       });
//       setAttendance(initialAttendance);
//     }
//   };

//   const toggleAttendance = (studentId: any) => {
//     if (sessionType !== 'CLASS') return;

//     setAttendance((prev: any) => ({
//       ...prev,
//       [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT',
//     }));
//   };

//   const handleSubmit = async () => {
//     if (!selectedDate) return;

//     setSaving(true);

//     try {
//       const dateStr = formatDate(selectedDate);

//       const payload = {
//         batchId,
//         sessionDate: dateStr,
//         sessionType: sessionType.toUpperCase(),
//         reason: sessionType !== 'CLASS' ? reason : undefined,
//         records:
//           sessionType === 'CLASS'
//             ? studentsData?.students?.map((student: any) => ({
//                 studentId: student._id,
//                 status: attendance[student._id] || 'ABSENT',
//               }))
//             : undefined,
//       };

//       await _axios.post('/attendance/mark', payload);
//       refetchSessions();
//       refetchStudents();
//       toast('Attendance saved successfully!');
//       // setSelectedDate(null);
//       // setAttendance({});
//       // setReason('');
//       // setSessionType('CLASS');
//     } catch (error) {
//       console.error('Error saving attendance:', error);
//       toast('Failed to save attendance');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const getSessionColor = (dateStr: any) => {
//     const session = sessionsData?.sessions[dateStr];
//     if (!session) return '';

//     switch (session.sessionType) {
//       case 'CLASS':
//         return 'bg-green-100 border-green-400';
//       case 'HOLIDAY':
//         return 'bg-yellow-100 border-yellow-400';
//       // case 'CANCELLED':
//       //   return 'bg-yellow-100 border-yellow-400';
//       default:
//         return '';
//     }
//   };

//   const renderCalendar = () => {
//     const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
//     const days = [];
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     for (let i = 0; i < startingDayOfWeek; i++) {
//       days.push(
//         <div key={`empty-${i}`} className="h-24 border border-gray-200"></div>,
//       );
//     }

//     for (let day = 1; day <= daysInMonth; day++) {
//       const date = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth(),
//         day,
//       );
//       const dateStr = formatDate(date);
//       const isFuture = date > today;
//       const sessionColor = getSessionColor(dateStr);
//       const session = sessionsData?.sessions[dateStr];
//       const isSelected = selectedDate && formatDate(selectedDate) === dateStr;

//       days.push(
//         <div
//           key={day}
//           onClick={() => !isFuture && handleDateClick(day)}
//           className={`h-24 border border-gray-300 p-2 ${
//             isFuture
//               ? 'bg-gray-100 cursor-not-allowed opacity-50'
//               : 'cursor-pointer hover:bg-gray-50'
//           } ${sessionColor} ${
//             isSelected ? 'ring-1 ring-blue-500 ring-offset-2' : ''
//           } transition-colors`}>
//           <div className="font-semibold text-sm">{day}</div>
//           {session && (
//             <div className="mt-1">
//               <div className="text-xs font-medium">
//                 {session.sessionType === 'CLASS' && '✓ Class'}
//                 {session.sessionType === 'HOLIDAY' && '🎉 Holiday'}
//                 {/* {session.sessionType === 'CANCELLED' && '✗ Cancelled'} */}
//               </div>
//               {session.reason && (
//                 <div className="text-xs text-gray-600 truncate">
//                   {session.reason}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>,
//       );
//     }

//     return days;
//   };

//   const changeMonth = (offset: any) => {
//     setCurrentDate(
//       new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1),
//     );
//   };

//   const getPresentCount = () => {
//     return Object.values(attendance).filter((status) => status === 'PRESENT')
//       .length;
//   };

//   const getAbsentCount = () => {
//     return Object.values(attendance).filter((status) => status === 'ABSENT')
//       .length;
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center gap-3">
//               <Calendar className="w-8 h-8 text-blue-600" />
//               <h1 className="text-2xl font-bold text-gray-800">
//                 Batch Attendance
//               </h1>
//             </div>
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={() => changeMonth(-1)}
//                 className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
//                 Previous
//               </button>
//               <span className="text-lg font-semibold">
//                 {currentDate.toLocaleDateString('en-US', {
//                   month: 'long',
//                   year: 'numeric',
//                 })}
//               </span>
//               <button
//                 onClick={() => changeMonth(1)}
//                 className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
//                 Next
//               </button>
//             </div>
//           </div>

//           <div className="grid grid-cols-7 gap-2 mb-2">
//             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
//               <div
//                 key={day}
//                 className="text-center font-semibold text-gray-700 py-2">
//                 {day}
//               </div>
//             ))}
//           </div>

//           <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>

//           <div className="mt-6 flex gap-4 text-sm">
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 bg-green-100 border border-green-400"></div>
//               <span>Class</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 bg-red-100 border border-red-400"></div>
//               <span>Holiday</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 bg-yellow-100 border border-yellow-400"></div>
//               <span>Cancelled</span>
//             </div>
//           </div>
//         </div>

//         {selectedDate && (
//           <div className="bg-white rounded-lg shadow-lg p-6">
//             <div className="flex items-center justify-between mb-6">
//               <div>
//                 <h2 className="text-xl font-bold text-gray-800">
//                   Mark Attendance -{' '}
//                   {selectedDate.toLocaleDateString('en-US', {
//                     weekday: 'long',
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric',
//                   })}
//                 </h2>
//               </div>
//               <button
//                 onClick={() => setSelectedDate(null)}
//                 className="px-4 py-2 text-gray-600 hover:text-gray-800">
//                 Close
//               </button>
//             </div>

//             <div className="mb-6">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Session Type
//               </label>
//               {(() => {
//                 const dateStr = formatDate(selectedDate);
//                 const existingSession = sessionsData?.sessions[dateStr];

//                 // If session exists, only show that session type (read-only)
//                 if (existingSession) {
//                   return (
//                     <div className="px-4 py-3 bg-gray-100 rounded-lg border border-gray-300">
//                       <span className="font-medium text-gray-800">
//                         {existingSession.sessionType === 'CLASS' && '✓ Class'}
//                         {existingSession.sessionType === 'HOLIDAY' &&
//                           '🎉 Holiday'}
//                         {/* {existingSession.sessionType === 'CANCELLED' &&
//                           '✗ Cancelled'} */}
//                       </span>
//                     </div>
//                   );
//                 }

//                 // If no session exists, show all options
//                 return (
//                   <div className="flex gap-4">
//                     <label className="flex items-center gap-2">
//                       <input
//                         type="radio"
//                         value="CLASS"
//                         checked={sessionType === 'CLASS'}
//                         onChange={(e) => setSessionType(e.target.value)}
//                         className="w-4 h-4"
//                       />
//                       <span>Class</span>
//                     </label>
//                     <label className="flex items-center gap-2">
//                       <input
//                         type="radio"
//                         value="HOLIDAY"
//                         checked={sessionType === 'HOLIDAY'}
//                         onChange={(e) => setSessionType(e.target.value)}
//                         className="w-4 h-4"
//                       />
//                       <span>Holiday</span>
//                     </label>
//                     {/* <label className="flex items-center gap-2">
//                       <input
//                         type="radio"
//                         value="CANCELLED"
//                         checked={sessionType === 'CANCELLED'}
//                         onChange={(e) => setSessionType(e.target.value)}
//                         className="w-4 h-4"
//                       />
//                       <span>Cancelled</span>
//                     </label> */}
//                   </div>
//                 );
//               })()}
//             </div>

//             {sessionType !== 'CLASS' && (
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Reason
//                 </label>
//                 <input
//                   type="text"
//                   value={reason}
//                   onChange={(e) => setReason(e.target.value)}
//                   placeholder="Enter reason for holiday/cancellation"
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//             )}

//             {sessionType === 'CLASS' && (
//               <div className="mb-6">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center gap-2">
//                     <Users className="w-5 h-5 text-gray-600" />
//                     <h3 className="text-lg font-semibold">
//                       Students ({studentsData?.students?.length})
//                     </h3>
//                   </div>
//                   <div className="flex gap-4 text-sm">
//                     <span className="text-green-600 font-medium">
//                       Present: {getPresentCount()}
//                     </span>
//                     <span className="text-red-600 font-medium">
//                       Absent: {getAbsentCount()}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="space-y-2 max-h-96 overflow-y-auto">
//                   {studentsData?.students?.map((student: any) => (
//                     <div
//                       key={student._id}
//                       onClick={() => toggleAttendance(student._id)}
//                       className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
//                         attendance[student._id] === 'PRESENT'
//                           ? 'bg-green-50 border-green-500'
//                           : 'bg-red-50 border-red-500'
//                       }`}>
//                       <div className="flex items-center gap-3">
//                         <div
//                           className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
//                             attendance[student._id] === 'PRESENT'
//                               ? 'bg-green-500 border-green-500'
//                               : 'bg-white border-gray-300'
//                           }`}>
//                           {attendance[student._id] === 'PRESENT' && (
//                             <span className="text-white text-sm">✓</span>
//                           )}
//                         </div>
//                         <div>
//                           <div className="font-medium text-gray-800">
//                             {student.studentName}
//                           </div>
//                           <div className="text-sm text-gray-600">
//                             {student.studentPhoneNumber}
//                           </div>
//                         </div>
//                       </div>
//                       <div
//                         className={`px-3 py-1 rounded-full text-sm font-medium ${
//                           attendance[student._id] === 'PRESENT'
//                             ? 'bg-green-500 text-white'
//                             : 'bg-red-500 text-white'
//                         }`}>
//                         {attendance[student._id] === 'PRESENT'
//                           ? 'Present'
//                           : 'Absent'}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             <div className="flex justify-end gap-4">
//               <button
//                 onClick={() => setSelectedDate(null)}
//                 className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSubmit}
//                 disabled={saving || (sessionType !== 'CLASS' && !reason)}
//                 className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
//                 {saving ? 'Saving...' : 'Save Attendance'}
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Calendar, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { _axios } from '@/lib/axios';
import { toast } from 'sonner';

export const Route = createFileRoute('/batches/attendance/$batchId')({
  component: BatchAttendance,
});

function BatchAttendance() {
  const navigate = useNavigate();
  const { batchId } = Route.useParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [sessionType, setSessionType] = useState('CLASS');
  const [reason, setReason] = useState('');
  const [attendance, setAttendance]: any = useState({});
  const [saving, setSaving] = useState(false);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: sessionsData, refetch: refetchSessions } = useQuery({
    queryKey: ['attendanceSessions', batchId, year, month],
    queryFn: async () => {
      const res = await _axios.get(
        `/attendance/sessions?batchId=${batchId}&year=${year}&month=${month}`,
      );
      return res.data;
    },
  });

  const { data: studentsData, refetch: refetchStudents } = useQuery({
    queryKey: ['batchStudents', batchId],
    queryFn: async () => {
      const res = await _axios.get(
        `/attendance/students-list?batchId=${batchId}`,
      );
      return res.data;
    },
  });

  console.log(studentsData);

  const formatDate = (date: any) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const fetchAttendanceRecords = async (sessionDate: string) => {
    try {
      const res = await _axios.get(
        `/attendance/records?batchId=${batchId}&sessionDate=${sessionDate}`,
      );
      return res.data;
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      return null;
    }
  };

  const isCurrentMonth = (date: Date) => {
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  const handleDateClick = async (day: any) => {
    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if date is in the current month
    const isInCurrentMonth = isCurrentMonth(clickedDate);

    // For past dates or current month dates, allow interaction
    // Block future dates that are NOT in the current month
    if (clickedDate > today && !isInCurrentMonth) return;

    const dateStr = formatDate(clickedDate);
    const session = sessionsData?.sessions[dateStr];

    // If CLASS session exists, fetch existing attendance records
    if (session && session.sessionType === 'CLASS') {
      const recordsData = await fetchAttendanceRecords(dateStr);

      if (recordsData?.records && recordsData.records.length > 0) {
        // Populate attendance state with existing records
        const existingAttendance: any = {};
        recordsData.records.forEach((record: any) => {
          existingAttendance[record.studentId] = record.status;
        });

        // Fill in any missing students as ABSENT
        studentsData?.students?.forEach((student: any) => {
          if (!existingAttendance[student._id]) {
            existingAttendance[student._id] = 'ABSENT';
          }
        });

        setAttendance(existingAttendance);
      } else {
        // No records found, initialize with ABSENT
        const initialAttendance: any = {};
        studentsData?.students?.forEach((student: any) => {
          initialAttendance[student._id] = 'PRESENT';
        });
        setAttendance(initialAttendance);
      }

      setSelectedDate(clickedDate);
      setSessionType('CLASS');
      setReason('');
    } else if (session) {
      // Non-CLASS session (HOLIDAY/CANCELLED)
      setSelectedDate(clickedDate);
      setSessionType(session.sessionType);
      setReason(session.reason || '');
    } else {
      // No session exists, create new
      setSelectedDate(clickedDate);

      // For future dates in current month, default to HOLIDAY
      // For past dates, default to CLASS
      if (clickedDate > today && isInCurrentMonth) {
        setSessionType('HOLIDAY');
      } else {
        setSessionType('CLASS');
      }

      setReason('');
      const initialAttendance: any = {};
      studentsData?.students?.forEach((student: any) => {
        initialAttendance[student._id] = 'PRESENT';
      });
      setAttendance(initialAttendance);
    }
  };

  const toggleAttendance = (studentId: any) => {
    if (sessionType !== 'CLASS') return;

    setAttendance((prev: any) => ({
      ...prev,
      [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT',
    }));
  };

  const handleSubmit = async () => {
    if (!selectedDate) return;

    setSaving(true);

    try {
      const dateStr = formatDate(selectedDate);

      const payload = {
        batchId,
        sessionDate: dateStr,
        sessionType: sessionType.toUpperCase(),
        reason: sessionType !== 'CLASS' ? reason : undefined,
        records:
          sessionType === 'CLASS'
            ? studentsData?.students?.map((student: any) => ({
                studentId: student._id,
                status: attendance[student._id] || 'ABSENT',
              }))
            : undefined,
      };

      await _axios.post('/attendance/mark', payload);
      refetchSessions();
      refetchStudents();
      toast('Attendance saved successfully!');
      // setSelectedDate(null);
      // setAttendance({});
      // setReason('');
      // setSessionType('CLASS');
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getSessionColor = (dateStr: any) => {
    const session = sessionsData?.sessions[dateStr];
    if (!session) return '';

    switch (session.sessionType) {
      case 'CLASS':
        return 'bg-green-100 border-green-400';
      case 'HOLIDAY':
        return 'bg-yellow-100 border-yellow-400';
      // case 'CANCELLED':
      //   return 'bg-yellow-100 border-yellow-400';
      default:
        return '';
    }
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-200"></div>,
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      );
      const dateStr = formatDate(date);
      const isInCurrentMonth = isCurrentMonth(date);
      const isFuture = date > today && !isInCurrentMonth; // Only disable future dates outside current month
      const sessionColor = getSessionColor(dateStr);
      const session = sessionsData?.sessions[dateStr];
      const isSelected = selectedDate && formatDate(selectedDate) === dateStr;

      days.push(
        <div
          key={day}
          onClick={() => !isFuture && handleDateClick(day)}
          className={`h-24 border border-gray-300 p-2 ${
            isFuture
              ? 'bg-gray-100 cursor-not-allowed opacity-50'
              : 'cursor-pointer hover:bg-gray-50'
          } ${sessionColor} ${
            isSelected ? 'ring-1 ring-blue-500 ring-offset-2' : ''
          } transition-colors`}>
          <div className="font-semibold text-sm">{day}</div>
          {session && (
            <div className="mt-1">
              <div className="text-xs font-medium">
                {session.sessionType === 'CLASS' && '✓ Class'}
                {session.sessionType === 'HOLIDAY' && '🎉 Day Off'}
                {/* {session.sessionType === 'CANCELLED' && '✗ Cancelled'} */}
              </div>
              {session.reason && (
                <div className="text-xs text-gray-600 truncate">
                  {session.reason}
                </div>
              )}
            </div>
          )}
        </div>,
      );
    }

    return days;
  };

  const changeMonth = (offset: any) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1),
    );
  };

  const getPresentCount = () => {
    return Object.values(attendance).filter((status) => status === 'PRESENT')
      .length;
  };

  const getAbsentCount = () => {
    return Object.values(attendance).filter((status) => status === 'ABSENT')
      .length;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">
                Batch Attendance
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => changeMonth(-1)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Previous
              </button>
              <span className="text-lg font-semibold">
                {currentDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Next
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>

          <div className="mt-6 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-400"></div>
              <span>Class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-400"></div>
              <span>Day Off</span>
            </div>
          </div>
        </div>

        {selectedDate && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Mark Attendance -{' '}
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Close
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Type
              </label>
              {(() => {
                const dateStr = formatDate(selectedDate);
                const existingSession = sessionsData?.sessions[dateStr];

                // If session exists, only show that session type (read-only)
                if (existingSession) {
                  return (
                    <div className="px-4 py-3 bg-gray-100 rounded-lg border border-gray-300">
                      <span className="font-medium text-gray-800">
                        {existingSession.sessionType === 'CLASS' && '✓ Class'}
                        {existingSession.sessionType === 'HOLIDAY' &&
                          '🎉 Day Off'}
                        {/* {existingSession.sessionType === 'CANCELLED' &&
                          '✗ Cancelled'} */}
                      </span>
                    </div>
                  );
                }

                // If no session exists, show all options
                return (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="CLASS"
                        checked={sessionType === 'CLASS'}
                        onChange={(e) => setSessionType(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>Class</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="HOLIDAY"
                        checked={sessionType === 'HOLIDAY'}
                        onChange={(e) => setSessionType(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>Day Off</span>
                    </label>
                    {/* <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="CANCELLED"
                        checked={sessionType === 'CANCELLED'}
                        onChange={(e) => setSessionType(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>Cancelled</span>
                    </label> */}
                  </div>
                );
              })()}
            </div>

            {sessionType !== 'CLASS' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for Day Off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {sessionType === 'CLASS' && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold">
                      Students ({studentsData?.students?.length})
                    </h3>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600 font-medium">
                      Present: {getPresentCount()}
                    </span>
                    <span className="text-red-600 font-medium">
                      Absent: {getAbsentCount()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {studentsData?.students?.map((student: any) => (
                    <div
                      key={student._id}
                      onClick={() => toggleAttendance(student._id)}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        attendance[student._id] === 'PRESENT'
                          ? 'bg-green-50 border-green-500'
                          : 'bg-red-50 border-red-500'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            attendance[student._id] === 'PRESENT'
                              ? 'bg-green-500 border-green-500'
                              : 'bg-white border-gray-300'
                          }`}>
                          {attendance[student._id] === 'PRESENT' && (
                            <span className="text-white text-sm">✓</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {student.studentName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {student.studentPhoneNumber}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          attendance[student._id] === 'PRESENT'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                        {attendance[student._id] === 'PRESENT'
                          ? 'Present'
                          : 'Absent'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setSelectedDate(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || (sessionType !== 'CLASS' && !reason)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
