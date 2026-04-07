export const WHATSAPP_TEMPLATES = [
    // {
    //     id: 'tuition_important_class_reminder',
    //     name: 'Important Class Reminder',
    //     fields: [
    //         {
    //             key: 'timeReference',
    //             label: 'Time Reference',
    //             placeholder: 'e.g., Tomorrow, Today, Monday',
    //         },
    //     ],
    //     preview: (values: any) =>
    //         `Dear Parents and Students,\n\n${values.timeReference || '{{1}}'} most important class. Be present without fail`,
    // },
    // {
    //     id: 'jee_test_series_notification',
    //     name: 'JEE Mains Test Notification',
    //     fields: [
    //         {
    //             key: 'seriesNumber',
    //             label: 'Series Number',
    //             placeholder: 'e.g., SERIES 15',
    //         },
    //         {
    //             key: 'portions',
    //             label: 'Portions',
    //             placeholder: 'e.g., MATHS, PHYSICS, CHEMISTRY',
    //         },
    //         {
    //             key: 'deadlineDate',
    //             label: 'Deadline Date',
    //             placeholder: 'e.g., 07-02-2026 (Saturday)',
    //         },
    //         {
    //             key: 'deadlineTime',
    //             label: 'Deadline Time',
    //             placeholder: 'e.g., 10.00 pm',
    //         },
    //     ],
    //     preview: (values: any) =>
    //         `Dear Parents and Students,\n\nJEE mains - is now LIVE on the IDEAL App under the test series titled:\n📌 JEE 2025 - ${values.seriesNumber || '{{1}}'}\n📌 PORTIONS:-\n${values.portions || '{{2}}'}\n📌 Task: Kindly ensure this is completed within the given time after carefully following the instructions.\n📌 Deadline: The test closes ${values.deadlineDate || '{{3}}'} @ ${values.deadlineTime || '{{4}}'}\n📌 Solutions can be viewed in the app only after the deadline.`,
    // },
    {
        id: 'full_portion_exam',
        name: 'Full Portion Exam Reminder (Tamil)',
        fields: [
            {
                key: 'day',
                label: 'Day (Tamil)',
                placeholder: 'e.g., நாளை (ஞாயிற்றுக்கிழமை)',
            },
            { key: 'startTime', label: 'Start Time', placeholder: 'e.g., 8.00 am' },
            { key: 'endTime', label: 'End Time', placeholder: 'e.g., 9.00 pm' },
        ],
        preview: (values: any) =>
            `Dear Parents and Students,\n\nFULL PORTION தேர்வினை ${values.day || '{{1}}'} ஏதேனும் ஒரு நேரத்தில் வந்து கண்டிப்பாக முடிக்கவும்.\nSchedule :\nBetween ${values.startTime || '{{2}}'} to ${values.endTime || '{{3}}'}`,
    },
    {
        id: 'signed_answer_sheet_reminder',
        name: 'Answer Sheet Signature Request (Tamil)',
        fields: [
            { key: 'testCode', label: 'Test Code', placeholder: 'e.g., ART 32' },
            {
                key: 'testName',
                label: 'Test Name',
                placeholder: 'e.g., Full Portion 7',
            },
            { key: 'testDate', label: 'Test Date', placeholder: 'e.g., 06/02/2026' },
        ],
        preview: (values: any) =>
            `அன்பிற்குரிய பெற்றோர்களே,\n\nதிருத்தி கொடுக்கப்பட்ட ${values.testCode || '{{1}}'} - ${values.testName || '{{2}}'} (${values.testDate || '{{3}}'}) விடைத்தாளில் வரும் போது கையொப்பம் இட்டு கொடுத்து விடவும்`,
    },
    // {
    //     id: 'next_class_schedule',
    //     name: 'Next Class Schedule',
    //     fields: [
    //         {
    //             key: 'date',
    //             label: 'Date',
    //             placeholder: 'e.g., 11-02-2026 (Wednesday)',
    //         },
    //         { key: 'time', label: 'Time', placeholder: 'e.g., 5.00 am to 7.45 am' },
    //         {
    //             key: 'testPortion',
    //             label: 'Test Portion',
    //             placeholder: 'e.g., ART 34 - FULL PORTION 9',
    //         },
    //     ],
    //     preview: (values: any) =>
    //         `Dear Parents and Students,\n\nNEXT CLASS\nDate : ${values.date || '{{1}}'}\nTime:\n${values.time || '{{2}}'}\nTest Portion :\n${values.testPortion || '{{3}}'}`,
    // },
];