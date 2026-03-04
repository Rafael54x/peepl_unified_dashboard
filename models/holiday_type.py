from odoo import models, fields, api


class HolidayType(models.Model):
    _name = 'holiday.type'
    _description = 'Holiday Type'
    _order = 'name'

    name = fields.Char(string='Holiday Type', required=True)
    code = fields.Char(string='Code', required=True)
    active = fields.Boolean(string='Active', default=True)
    description = fields.Text(string='Description')