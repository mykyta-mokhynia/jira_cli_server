// Common functions and constants are in config.js

/**
 * Update space (project) name in Jira
 * @param {string} projectKey - Project key
 * @param {string} newName - New project name
 */
function updateProjectName_(projectKey, newName) {
  try {
    const url = `${JIRA_BASE_URL}/rest/api/3/project/${projectKey}`;
    const payload = {
      name: newName
    };

    const res = UrlFetchApp.fetch(url, {
      method: "put",
      headers: {
        ...jiraAuthHeader_(),
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    if (res.getResponseCode() >= 300) {
      throw new Error(`HTTP ${res.getResponseCode()}: ${res.getContentText()}`);
    }

    return JSON.parse(res.getContentText());
  } catch (e) {
    throw new Error(`Failed to update project ${projectKey}: ${e.message}`);
  }
}

/**
 * Update board name in Jira
 * Note: Board names in Jira are typically derived from filters and may not be directly updatable via API.
 * This function attempts to update via Agile API, but may return HTTP 405 (Method Not Allowed).
 * If this fails, board names need to be updated manually in Jira UI or via filter updates.
 * @param {string} boardId - Board ID
 * @param {string} newName - New board name
 */
function updateBoardName_(boardId, newName) {
  try {
    const url = `${JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}`;
    const payload = {
      name: newName
    };

    const res = UrlFetchApp.fetch(url, {
      method: "put",
      headers: {
        ...jiraAuthHeader_(),
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    if (res.getResponseCode() >= 300) {
      throw new Error(`HTTP ${res.getResponseCode()}: ${res.getContentText()}`);
    }

    return JSON.parse(res.getContentText());
  } catch (e) {
    throw new Error(`Failed to update board ${boardId}: ${e.message}`);
  }
}

/**
 * Get project key by project name
 */
function getProjectKeyByName_(projectName) {
  const ss = SpreadsheetApp.getActive();
  const groupsSheet = ss.getSheetByName("Groups");
  if (!groupsSheet) return null;

  const data = groupsSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === projectName && data[i][1]) {
      return data[i][1]; // Return Space Key
    }
  }
  return null;
}

/**
 * Get board ID by board name and space key
 */
function getBoardIdByName_(boardName, spaceKey) {
  const ss = SpreadsheetApp.getActive();
  const groupsSheet = ss.getSheetByName("Groups");
  if (!groupsSheet) return null;

  const data = groupsSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === spaceKey && data[i][2] === boardName && data[i][3]) {
      return data[i][3]; // Return Board ID
    }
  }
  return null;
}

/**
 * Handle edits to Rename sheet
 * - Updates headers when Type is changed
 * - Sets "Changed" status when New Name is edited
 * - Executes rename when Status is set to "Run"
 */
function onEditRename(e) {
  if (!e || !e.range) return;
  
  const sh = e.range.getSheet();
  if (!sh || sh.getName() !== "Rename") return;
  
  const a1 = e.range.getA1Notation();
  const row = e.range.getRow();
  const col = e.range.getColumn();
  const type = sh.getRange("A2").getValue();
  
  // If Type (A2) is changed, update headers and reload data
  if (a1 === "A2") {
    renderRenameHeaders_(type);
    loadRenameDataFromGroups_();
    return;
  }
  
  // If New Name column is edited (row 4+), set status to "Changed"
  if (row >= 4) {
    // Column positions:
    // Space: A=Space Name, B=Current Space Name, C=New Space Name, D=Status
    // Board: A=Space Name, B=Group, C=Current Board Name, D=New Board Name, E=Status
    const newNameCol = type === "Space" ? 3 : 4; // Column C for Space, D for Board
    const currentNameCol = type === "Space" ? 2 : 3; // Column B for Space, C for Board
    const statusCol = type === "Space" ? 4 : 5; // Column D for Space, E for Board
    
    // Check if edited column is New Name column
    if (col === newNameCol) {
      const currentName = sh.getRange(row, currentNameCol).getValue();
      const newName = e.value || "";
      
      // Only set "Changed" if new name is different from current name
      if (newName && newName !== currentName) {
        sh.getRange(row, statusCol).setValue("Changed");
        sh.getRange(row, statusCol)
          .setBackground("#ffcccc") // Red background
          .setFontColor("#cc0000"); // Red text
      } else if (!newName || newName === currentName) {
        // Reset to "All up to date" if cleared or same as current
        sh.getRange(row, statusCol).setValue("All up to date");
        sh.getRange(row, statusCol)
          .setBackground(null)
          .setFontColor(null);
      }
      return;
    }
    
    // If Status column is edited and set to "Run", execute rename
    if (col === statusCol) {
      const status = e.value || "";
      if (status === "Run") {
        processRenameRow_(row, type);
      }
    }
  }
}

/**
 * Process rename for a specific row
 * @param {number} row - Row number (1-based)
 * @param {string} type - "Space" or "Board"
 */
function processRenameRow_(row, type) {
  const sh = SpreadsheetApp.getActive().getSheetByName("Rename");
  if (!sh) return;
  
  // Column positions:
  // Space: A=Space Name, B=Current Space Name, C=New Space Name, D=Status
  // Board: A=Space Name, B=Group, C=Current Board Name, D=New Board Name, E=Status
  const numCols = type === "Space" ? 4 : 5;
  const data = sh.getRange(row, 1, 1, numCols).getValues()[0];
  
  const spaceName = data[0] || "";
  const currentName = type === "Space" ? data[1] : data[2]; // B for Space, C for Board
  const newName = type === "Space" ? data[2] : data[3]; // C for Space, D for Board
  const statusCol = type === "Space" ? 4 : 5; // D for Space, E for Board
  const currentNameCol = type === "Space" ? 2 : 3; // B for Space, C for Board
  
  let result = "All up to date";
  let errorMsg = "";
  
  try {
    if (type === "Space") {
      if (!currentName || !newName) {
        result = "Changed";
        errorMsg = "Current name and new name required";
      } else if (currentName === newName) {
        result = "All up to date";
      } else {
        const projectKey = getProjectKeyByName_(currentName);
        if (!projectKey) {
          result = "Changed";
          errorMsg = "Project key not found";
        } else {
          updateProjectName_(projectKey, newName);
          result = "All up to date";
          console.log(`Updated project ${projectKey} name: "${currentName}" → "${newName}"`);
        }
      }
    } else if (type === "Board") {
      if (!currentName || !newName) {
        result = "Changed";
        errorMsg = "Current name and new name required";
      } else if (currentName === newName) {
        result = "All up to date";
      } else {
        const projectKey = getProjectKeyByName_(spaceName);
        if (!projectKey) {
          result = "Changed";
          errorMsg = "Space key not found";
        } else {
          const boardId = getBoardIdByName_(currentName, projectKey);
          if (!boardId) {
            result = "Changed";
            errorMsg = "Board ID not found";
          } else {
            updateBoardName_(boardId, newName);
            result = "All up to date";
            console.log(`Updated board ${boardId} name: "${currentName}" → "${newName}"`);
          }
        }
      }
    }
  } catch (e) {
    result = "Changed";
    errorMsg = e.message;
    console.error(`Error processing row ${row}: ${e.message}`);
  }
  
  // Update status in sheet
  sh.getRange(row, statusCol).setValue(result);
  
  // Set formatting based on result
  if (result === "Changed") {
    sh.getRange(row, statusCol)
      .setBackground("#ffcccc") // Red background
      .setFontColor("#cc0000"); // Red text
    if (errorMsg) {
      sh.getRange(row, statusCol).setNote(errorMsg);
    }
  } else {
    sh.getRange(row, statusCol)
      .setBackground(null)
      .setFontColor(null);
    sh.getRange(row, statusCol).clearNote();
  }
  
  // Update Current Name if rename was successful
  if (result === "All up to date" && newName) {
    sh.getRange(row, currentNameCol).setValue(newName);
  }
}
