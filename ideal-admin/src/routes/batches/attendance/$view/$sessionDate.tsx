import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Check, Edit2, Save, X } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { _axios } from '@/lib/axios'

export const Route = createFileRoute('/batches/attendance/$view/$sessionDate')({
  component: ViewEditAttendance,
})

function ViewEditAttendance() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { view: batchId, sessionDate } = Route.useParams()
  const [isEditing, setIsEditing] = useState(false)
  const [attendance, setAttendance] = useState({})
  const [saving, setSaving] = useState(false)

  // Fetch session details
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['attendanceSession', batchId, sessionDate],
    queryFn: async () => {
      const res = await _axios.get(
        `/attendance/session-details?batchId=${batchId}&sessionDate=${sessionDate}`,
      )
      return res.data
    },
  })

  // Fetch attendance records
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['attendanceRecords', batchId, sessionDate],
    queryFn: async () => {
      const res = await _axios.get(
        `/attendance/records?batchId=${batchId}&sessionDate=${sessionDate}`,
      )
      return res.data
    },
  })

  // Initialize attendance state when records load
  useEffect(() => {
    if (recordsData?.records) {
      const attendanceMap = {}
      recordsData.records.forEach((record) => {
        attendanceMap[record.studentId] = record.status
      })
      setAttendance(attendanceMap)
    }
  }, [recordsData])

  const toggleAttendance = (studentId) => {
    if (!isEditing) return

    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const records = Object.keys(attendance).map((studentId) => ({
        studentId,
        status: attendance[studentId],
      }))

      await _axios.post('/attendance/mark', {
        batchId,
        sessionDate,
        sessionType: 'CLASS',
        records,
      })

      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['attendanceRecords', batchId, sessionDate])
      queryClient.invalidateQueries(['attendanceSessions'])

      setIsEditing(false)
      alert('Attendance updated successfully!')
    } catch (error) {
      console.error('Error updating attendance:', error)
      alert('Failed to update attendance')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset to original values
    if (recordsData?.records) {
      const attendanceMap = {}
      recordsData.records.forEach((record) => {
        attendanceMap[record.studentId] = record.status
      })
      setAttendance(attendanceMap)
    }
    setIsEditing(false)
  }

  const getAttendanceStats = () => {
    const total = Object.keys(attendance).length
    const present = Object.values(attendance).filter(
      (status) => status === 'present',
    ).length
    const absent = total - present
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    return { total, present, absent, percentage }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (sessionLoading || recordsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    )
  }

  const stats = getAttendanceStats()
  const students = recordsData?.records || []

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() =>
                navigate({
                  to: '/batches/attendance/$batchId',
                  params: { batchId },
                })
              }
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Calendar
            </button>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4" />
                Edit Attendance
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Class Attendance
          </h1>
          <p className="text-gray-600">{formatDate(sessionDate)}</p>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Total Students</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Present</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.present}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Absent</div>
              <div className="text-2xl font-bold text-red-600">
                {stats.absent}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Attendance %</div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.percentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Attendance List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Student Attendance</h2>
            {isEditing && (
              <span className="ml-auto text-sm text-blue-600 font-medium">
                Click on student to toggle attendance
              </span>
            )}
          </div>

          <div className="space-y-2">
            {students.map((record) => (
              <div
                key={record.studentId}
                onClick={() => toggleAttendance(record.studentId)}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  isEditing ? 'cursor-pointer hover:shadow-md' : ''
                } ${
                  attendance[record.studentId] === 'present'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      attendance[record.studentId] === 'present'
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {attendance[record.studentId] === 'present' && (
                      <Check className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 text-lg">
                      {record.studentName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {record.studentPhoneNumber}
                    </div>
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    attendance[record.studentId] === 'present'
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {attendance[record.studentId] === 'present'
                    ? 'Present'
                    : 'Absent'}
                </div>
              </div>
            ))}
          </div>

          {students.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No attendance records found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
