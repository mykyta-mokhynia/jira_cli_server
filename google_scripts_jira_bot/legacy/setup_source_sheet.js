function setupSourceSheet() {
    const ss = SpreadsheetApp.getActive();
    let sh = ss.getSheetByName("Source");

    if (!sh) sh = ss.insertSheet("Source");

    sh.clear();
    sh.clearFormats();

    const headers = ["Name", "Surname", "Email", "ProjectKey", "Group", "Role"];
    sh.getRange("A1:F1").setValues([headers]);

    sh.autoResizeColumns(1, 6);
    sh.setFrozenRows(1);
}