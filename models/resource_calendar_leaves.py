from odoo import models, fields, api


class ResourceCalendarLeaves(models.Model):
    _inherit = 'resource.calendar.leaves'

    holiday_type_id = fields.Many2one(
        'holiday.type',
        string='Holiday Type',
        help='Type of holiday for public holidays'
    )

    @api.model
    def default_get(self, fields_list):
        res = super().default_get(fields_list)
        if 'work_entry_type_id' not in res or not res['work_entry_type_id']:
            generic_type = self.env['hr.work.entry.type'].search([('name', '=', 'Generic Time Off')], limit=1)
            if generic_type:
                res['work_entry_type_id'] = generic_type.id
        
        if 'calendar_id' not in res or not res['calendar_id']:
            standard_calendar = self.env['resource.calendar'].search([('name', '=', 'Standard 40 hours/week')], limit=1)
            if standard_calendar:
                res['calendar_id'] = standard_calendar.id
        
        return res