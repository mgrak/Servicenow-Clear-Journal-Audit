/* BUILT FOR EVENT MANAGEMENT ONLY */
//FIND AFFECTED RECORDS
/*
var gr = new GlideAggregate('sys_audit');
gr.addAggregate('COUNT');
gr.groupBy('documentkey');
gr.addEncodedQuery('sys_created_onONThis month@javascript:gs.beginningOfThisMonth()@javascript:gs.endOfThisMonth()^fieldname=work_notes^tablename=incident^user=system');
gr.query();
while (gr.next()) {
if (gr.getAggregate('COUNT') > 2000)
gs.info(gr.getValue('documentkey') + ': ' + gr.getAggregate('COUNT'));
}
 */
 
var dryRun = true,
	requestIncident = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', //The Incident of the person asking for a journal wipe
	fields = ['close_code', 'description', 'incident_state', 'reopened_time', 'reopen_count', 'resolved_by', 'short_description', 'state', 'u_inactive_duration', 'work_notes', 'comments'],
	cleanRecord = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
	table = 'incident';
var grJournal = new GlideRecord('sys_journal_field');
grJournal.addQuery('name', table);
grJournal.addQuery('element_id', cleanRecord);
grJournal.addQuery('sys_created_by', 'system'); //dont lose comments by end users
//grJournal.addQuery('element', 'work_notes').addOrCondition('element', 'comments');
//grJournal.addEncodedQuery('elementIN' + fields);
var orEval = "grJournal.addQuery('element', 'work_notes')";
fields.forEach(function(value){
	orEval += ".addOrCondition('element', '" + value + "')";
});
eval(orEval);

grJournal.query();
gs.info('Journal Count: ' + grJournal.getRowCount() + '\nQuery: ' + grJournal.getEncodedQuery());
if (!dryRun) grJournal.deleteMultiple();

var grAudit = new GlideRecord('sys_audit');
grAudit.addQuery('documentkey', cleanRecord);
grAudit.addQuery('tablename', table);
var orEval = "grAudit.addQuery('fieldname', 'work_notes')";
fields.forEach(function(value){
	orEval += ".addOrCondition('fieldname', '" + value + "')";
});
eval(orEval);
//grAudit.addQuery('fieldname', 'work_notes').addOrCondition('fieldname', 'comments');
//grJournal.addEncodedQuery('fieldnameIN' + fields);
grAudit.addQuery('user', 'system');
grAudit.query();
gs.info(grAudit.getEncodedQuery());
gs.info('Audit Count: ' + grAudit.getRowCount() + '\nQuery: ' + grAudit.getEncodedQuery());
if (!dryRun) grAudit.deleteMultiple();

var grHistory = new GlideRecord('sys_history_set');
grHistory.addQuery('id', cleanRecord);
grHistory.addQuery('table', table);
grHistory.query();
gs.info('History Count: ' + grHistory.getRowCount() + '\nQuery: ' + grHistory.getEncodedQuery());
if (!dryRun) grHistory.deleteMultiple();

var gr = new GlideRecord(table);
if (gr.get(cleanRecord)) {
    var grRequest = GlideRecord('incident');
    grRequest.get(requestIncident);
    var requestor = grRequest.caller_id.getDisplayValue();
    var requestNumber = grRequest.number;
    gr.work_notes = 'Record\'s Audit and Journal table entries have been wiped that were created by the system for the following fields:\n ' + fields + '\n\nThis was requested and approved by ' + requestor + ' via incident ' + requestNumber + ' and applied  via ' + grRequest.rfc.getDisplayValue();
    if (!dryRun) gr.update();
}
