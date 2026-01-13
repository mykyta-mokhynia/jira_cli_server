function setupSourceConfluenceSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName("Source_Confluence");

  if (!sh) sh = ss.insertSheet("Source_Confluence");

  sh.clear();
  sh.clearFormats();

  const headers = [
    "Name",
    "Surname",
    "Email",
    "SpaceKey",
    "SpaceName",
    "Permission",
    "GrantedVia",
    "GrantedBy"
  ];
  sh.getRange("A1:H1").setValues([headers]);

  sh.autoResizeColumns(1, 8);
  sh.setFrozenRows(1);
}

