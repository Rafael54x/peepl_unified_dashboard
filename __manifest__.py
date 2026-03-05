# -*- coding: utf-8 -*-
{
    'name': 'Peepl HR Dashboard',
    'version': '19.0.1.0.0',
    'category': 'HR/Dashboard',
    'summary': 'HR Dashboard - Employee, Recruitment, Attendance',
    'description': """
Peepl HR Dashboard
=======================
Menggabungkan semua dashboard dalam satu modul:
* My Dashboard (Employee Dashboard)
* Weekly Report Dashboard dengan Details
* Recruitment Dashboard
* Attendance Analytics Dashboard
    """,
    'author': 'Peepl',
    'website': 'https://peepl.tech',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'hr',
        'hr_attendance',
        'hr_recruitment',
        'hr_payroll',
        'peepl_weekly_report',
        'resource',
        'hr_holidays',
    ],
    'images': ['static/description/icon.png'],
    'data': [
        'security/security.xml',
        'security/ir.model.access.csv',
        'views/hr_employee_views.xml',
        'views/unified_dashboard_menu.xml',
        'views/holiday_type_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'peepl_unified_dashboard/static/src/css/sidebar.css',
            'peepl_unified_dashboard/static/src/css/my_dashboard.css',
            'peepl_unified_dashboard/static/src/css/weekly_report_dashboard.css',
            'peepl_unified_dashboard/static/src/css/recruitment_dashboard.css',
            'peepl_unified_dashboard/static/src/css/attendance_dashboard.css',
            'peepl_unified_dashboard/static/src/css/working_calendar.css',
            'peepl_unified_dashboard/static/src/css/employee.css',
            'peepl_unified_dashboard/static/src/css/unified_dashboard.css',
            'peepl_unified_dashboard/static/src/css/modern_dashboards.css',
            'peepl_unified_dashboard/static/src/js/unified_dashboard.js',
            'peepl_unified_dashboard/static/src/js/my_dashboard.js',
            'peepl_unified_dashboard/static/src/js/weekly_report_dashboard.js',
            'peepl_unified_dashboard/static/src/js/recruitment_dashboard.js',
            'peepl_unified_dashboard/static/src/js/attendance_dashboard.js',
            'peepl_unified_dashboard/static/src/js/working_calendar.js',
            'peepl_unified_dashboard/static/src/js/employee.js',
            'peepl_unified_dashboard/static/src/js/employee_detail.js',
            'peepl_unified_dashboard/static/src/xml/unified_dashboard.xml',
            'peepl_unified_dashboard/static/src/xml/my_dashboard.xml',
            'peepl_unified_dashboard/static/src/xml/weekly_report_dashboard.xml',
            'peepl_unified_dashboard/static/src/xml/recruitment_dashboard.xml',
            'peepl_unified_dashboard/static/src/xml/attendance_dashboard.xml',
            'peepl_unified_dashboard/static/src/xml/working_calendar.xml',
            'peepl_unified_dashboard/static/src/xml/employee.xml',
        ],
    },
    'installable': True,
    'auto_install': False,
    'application': True,
}
