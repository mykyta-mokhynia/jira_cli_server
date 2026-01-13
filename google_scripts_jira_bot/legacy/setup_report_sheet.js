function setupReportSheet() {
  const ss = SpreadsheetApp.getActive();
  let rep = ss.getSheetByName("Report");

  if (rep) ss.deleteSheet(rep);
  rep = ss.insertSheet("Report");
  rep.setHiddenGridlines(false);

  rep.getRange("A1").setValue("Type").setFontWeight("bold");
  rep.getRange("B1").setValue("Search (email / name / surname / group)").setFontWeight("bold");
  rep.getRange("C1").setValue("Mode").setFontWeight("bold");
  rep.getRange("D1").setValue("Status").setFontWeight("bold");

  const typeValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Jira projects", "Confluence projects"], true)
    .setAllowInvalid(false)
    .build();

  rep.getRange("A2")
    .setValue("Jira projects")
    .setDataValidation(typeValidation);

  rep.getRange("B2")
    .setValue("")
    .setNote("Enter email / name / surname / group");

  const modeValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Без прив’язки", "Привʼязка до проектів"], true)
    .setAllowInvalid(false)
    .build();

  rep.getRange("C2")
    .setValue("Привʼязка до проектів")
    .setDataValidation(modeValidation);

  rep.getRange("D2").setValue("⚠ Введіть запит у B2");

  rep.getRange("A3").setValue("Data source").setFontWeight("bold");
  rep.getRange("B3").setValue("LIVE").setNote("Select data source");

  renderReportHeaders_("Jira projects");

  refreshDataSourceValidation_();

  rep.setFrozenRows(4);
  rep.autoResizeColumns(1, 12);
}

function refreshDataSourceValidation_() {
  const ss = SpreadsheetApp.getActive();
  const rep = ss.getSheetByName("Report");
  const backups = ss.getSheetByName("Report_Backups");
  if (!rep || !backups) return;

  const type =
    rep.getRange("A2").getValue() === "Confluence projects"
      ? "CONFLUENCE"
      : "JIRA";

  const rows = backups.getRange(2, 1, backups.getLastRow() - 1, 2).getValues();
  const dates = rows
    .filter(r => r[1] === type)
    .map(r => r[0]);

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["LIVE", ...dates], true)
    .setAllowInvalid(false)
    .build();

  rep.getRange("B3")
    .setDataValidation(rule)
    .setValue("LIVE");
}
