function setupGroupSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName("Groups");

  if (!sh) sh = ss.insertSheet("Groups");

  sh.clear();
  sh.clearFormats();

  const headers = [
    "Space Name",
    "Space Key",
    "Board Name",
    "Board ID",
    "Space Owner",
    "Person/Group",
    "Person Type",
    "Permission Schema"
  ];
  sh.getRange("A1:H1").setValues([headers]);

  sh.autoResizeColumns(1, 8);
  sh.setFrozenRows(1);
}

