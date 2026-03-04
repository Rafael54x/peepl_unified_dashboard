# -*- coding: utf-8 -*-
from odoo import models, api

class ResGroups(models.Model):
    _inherit = 'res.groups'

    @api.model
    def _copy_officer_access_to_user(self, group_mappings):
        """Copy all access rights from Officer groups to User groups"""
        for source_xml, target_xml in group_mappings:
            try:
                source_group = self.env.ref(source_xml)
                target_group = self.env.ref(target_xml)
                
                # Copy ir.model.access
                accesses = self.env['ir.model.access'].search([
                    ('group_id', '=', source_group.id)
                ])
                
                for access in accesses:
                    existing = self.env['ir.model.access'].search([
                        ('model_id', '=', access.model_id.id),
                        ('group_id', '=', target_group.id)
                    ], limit=1)
                    
                    if not existing:
                        self.env['ir.model.access'].create({
                            'name': f'{access.model_id.model}_user_access',
                            'model_id': access.model_id.id,
                            'group_id': target_group.id,
                            'perm_read': access.perm_read,
                            'perm_write': False,
                            'perm_create': False,
                            'perm_unlink': False,
                        })
                
                # Copy ir.rule
                rules = self.env['ir.rule'].search([
                    ('groups', 'in', [source_group.id])
                ])
                
                for rule in rules:
                    existing = self.env['ir.rule'].search([
                        ('model_id', '=', rule.model_id.id),
                        ('groups', 'in', [target_group.id]),
                        ('domain_force', '=', rule.domain_force)
                    ], limit=1)
                    
                    if not existing:
                        self.env['ir.rule'].create({
                            'name': f'{rule.model_id.model}_user_rule',
                            'model_id': rule.model_id.id,
                            'groups': [(4, target_group.id)],
                            'domain_force': rule.domain_force,
                            'perm_read': rule.perm_read,
                            'perm_write': False,
                            'perm_create': False,
                            'perm_unlink': False,
                        })
            except:
                pass
