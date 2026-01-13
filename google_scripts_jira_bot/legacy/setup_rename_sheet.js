function setupRenameSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName("Rename");

  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet("Rename");
  sh.setHiddenGridlines(false);

  // Row 1: Settings headers
  sh.getRange("A1").setValue("Type").setFontWeight("bold");
  sh.getRange("B1").setValue("Status").setFontWeight("bold");

  // Row 2: Settings values
  const typeValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Space", "Board"], true)
    .setAllowInvalid(false)
    .build();

  sh.getRange("A2")
    .setValue("Space")
    .setDataValidation(typeValidation);

  sh.getRange("B2").setValue("⚠ Select type and load data");

  // Row 3: Data headers (will be set dynamically)
  renderRenameHeaders_("Space");

  // Load data from Groups sheet
  loadRenameDataFromGroups_();

  sh.setFrozenRows(3);
  sh.autoResizeColumns(1, 8);
}

function loadRenameDataFromGroups_() {
  const ss = SpreadsheetApp.getActive();
  const groupsSheet = ss.getSheetByName("Groups");
  const renameSheet = ss.getSheetByName("Rename");

  if (!groupsSheet || !renameSheet) {
    console.warn("Groups or Rename sheet not found");
    return;
  }

  const selectedType = renameSheet.getRange("A2").getValue() || "Space";
  
  // Render headers based on selected type
  renderRenameHeaders_(selectedType);

  const data = groupsSheet.getDataRange().getValues();
  if (data.length < 2) {
    renameSheet.getRange("B2").setValue("⚠ No data in Groups sheet");
    return;
  }

  const uniqueSpaces = new Set();
  const uniqueBoards = new Set();
  const spaceGroupsMap = {}; // Map spaceKey -> groups

  // Collect unique spaces and boards (only from rows with filled values)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const spaceName = row[0]; // Space Name
    const spaceKey = row[1]; // Space Key
    const boardName = row[2]; // Board Name
    const boardId = row[3]; // Board ID
    const group = row[5] || ""; // Group

    // Only add if not empty
    if (spaceName && spaceKey) {
      uniqueSpaces.add(JSON.stringify({ name: spaceName, key: spaceKey }));
      // Collect groups for this space
      if (group && !spaceGroupsMap[spaceKey]) {
        spaceGroupsMap[spaceKey] = new Set();
      }
      if (group) {
        spaceGroupsMap[spaceKey].add(group);
      }
    }
    if (boardName && boardId) {
      uniqueBoards.add(JSON.stringify({ 
        name: boardName, 
        id: boardId, 
        spaceKey: spaceKey,
        spaceName: spaceName,
        group: group
      }));
    }
  }

  const out = [];

  if (selectedType === "Space") {
    // Add spaces only (no Group column)
    uniqueSpaces.forEach(spaceStr => {
      const space = JSON.parse(spaceStr);
      out.push([
        space.name, // Space Name
        space.name, // Current Space Name
        "", // New Space Name
        "All up to date" // Status
      ]);
    });
  } else {
    // Add boards only (with Group column)
    uniqueBoards.forEach(boardStr => {
      const board = JSON.parse(boardStr);
      out.push([
        board.spaceName || "", // Space Name (for reference)
        board.group || "", // Group
        board.name, // Current Board Name
        "", // New Board Name
        "All up to date" // Status
      ]);
    });
  }

  if (out.length > 0) {
    const numCols = selectedType === "Space" ? 4 : 5;
    renameSheet.getRange(4, 1, out.length, numCols).setValues(out);
    
    // Add status validation to all rows (clear BOTH columns D and E first, then apply to correct one)
    const statusCol = selectedType === "Space" ? 4 : 5;
    
    // Clear validations in both possible status columns
    renameSheet.getRange(4, 4, out.length, 1).clearDataValidations(); // Column D
    renameSheet.getRange(4, 5, out.length, 1).clearDataValidations(); // Column E
    
    const statusValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList(["All up to date", "Changed", "Run"], true)
      .setAllowInvalid(false)
      .build();
    renameSheet.getRange(4, statusCol, out.length, 1)
      .setDataValidation(statusValidation);
    
    renameSheet.getRange("B2").setValue(`✓ Loaded ${out.length} ${selectedType.toLowerCase()}s`);
  } else {
    renameSheet.getRange("B2").setValue(`⚠ No ${selectedType.toLowerCase()}s found`);
  }
}

/**
 * Render data headers based on Type selection (like renderReportHeaders_)
 * For Space: hides Group column
 * For Board: shows Group column
 * @param {string} type - "Space" or "Board"
 */
function renderRenameHeaders_(type) {
  const renameSheet = SpreadsheetApp.getActive().getSheetByName("Rename");
  if (!renameSheet) return;

  // Clear data area (row 4+) including data validation
  const lastRow = renameSheet.getLastRow();
  if (lastRow >= 4) {
    // Clear all data validation in data area (especially columns D and E where status can be)
    renameSheet.getRange(4, 1, lastRow - 3, 10).clearDataValidations();
    renameSheet.getRange(4, 1, lastRow - 3, 10).clearContent().clearFormat();
    
    // Explicitly clear validations in both possible status columns (D and E)
    renameSheet.getRange(4, 4, lastRow - 3, 1).clearDataValidations(); // Column D
    renameSheet.getRange(4, 5, lastRow - 3, 1).clearDataValidations(); // Column E
  }

  let headers;
  if (type === "Space") {
    // Space: no Group column
    headers = [
      "Space Name",
      "Current Space Name",
      "New Space Name",
      "Status"
    ];
  } else {
    // Board: with Group column
    headers = [
      "Space Name",
      "Group",
      "Current Board Name",
      "New Board Name",
      "Status"
    ];
  }

  renameSheet.getRange(3, 1, 1, headers.length).setValues([headers]);
  renameSheet.getRange(3, 1, 1, headers.length)
    .setBackground("#cfe2f3")
    .setFontWeight("bold");
  
  // Add status validation dropdown to all existing data rows
  addStatusValidation_(type);
}

/**
 * Add status validation dropdown to data rows
 * @param {string} type - "Space" or "Board"
 */
function addStatusValidation_(type) {
  const renameSheet = SpreadsheetApp.getActive().getSheetByName("Rename");
  if (!renameSheet) return;
  
  const statusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(["All up to date", "Changed", "Run"], true)
    .setAllowInvalid(false)
    .build();
  
  // Apply to all existing data rows (row 4+)
  const lastRow = renameSheet.getLastRow();
  if (lastRow >= 4) {
    const statusCol = type === "Space" ? 4 : 5; // Column D for Space, E for Board
    
    // Clear existing validation in BOTH possible status columns (D and E)
    renameSheet.getRange(4, 4, lastRow - 3, 1).clearDataValidations(); // Column D
    renameSheet.getRange(4, 5, lastRow - 3, 1).clearDataValidations(); // Column E
    
    // Apply new validation only to the correct column
    renameSheet.getRange(4, statusCol, lastRow - 3, 1)
      .setDataValidation(statusValidation);
    
    // Set default value only if cell is empty
    const statusValues = renameSheet.getRange(4, statusCol, lastRow - 3, 1).getValues();
    for (let i = 0; i < statusValues.length; i++) {
      if (!statusValues[i][0] || statusValues[i][0] === "") {
        renameSheet.getRange(4 + i, statusCol).setValue("All up to date");
      }
    }
  }
}

