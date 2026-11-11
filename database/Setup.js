// Run once from the Apps Script editor under the association account.
function setupAssociation() {
  var p = PropertiesService.getScriptProperties();
  p.setProperty('SPREADSHEET_ID', '13jNY3FNllr37vNexjibiBQOMBU1jGA0pgl0e_Ti2soQ');
  p.setProperty('ADMIN_EMAILS', 'anfmalumnia@gmail.com');
  if (!p.getProperty('BACKEND_SECRET')) p.setProperty('BACKEND_SECRET', Utilities.getUuid() + Utilities.getUuid());
  setup();
  console.log('Setup complete. Imported records: ' + rows('Legacy').length);
}
