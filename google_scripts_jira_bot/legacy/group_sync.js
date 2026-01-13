// Common functions and constants are in config.js

function fetchAllProjects_() {
  let startAt = 0;
  const maxResults = 100;
  const projects = [];

  while (true) {
    const resp = jiraFetch_("/rest/api/3/project/search", {
      startAt: startAt,
      maxResults: maxResults,
      expand: "lead,permissionScheme"
    });

    projects.push(...(resp.values || []));

    if (resp.isLast || !resp.values || resp.values.length === 0) break;
    startAt += maxResults;
  }

  return projects;
}

function fetchBoardsForProject_(projectKey) {
  try {
    // Use Agile API for boards
    const boards = jiraFetch_("/rest/agile/1.0/board", {
      projectKeyOrId: projectKey,
      maxResults: 100
    });

    return boards.values || [];
  } catch (e) {
    console.warn(`Failed to fetch boards for ${projectKey}: ${e.message}`);
    return [];
  }
}

function fetchPermissionScheme_(schemeId) {
  if (!schemeId) {
    console.log("fetchPermissionScheme_: No schemeId provided");
    return null;
  }
  
  try {
    // Try v3 API first (Cloud) with expand to get full details
    const scheme = jiraFetch_("/rest/api/3/permissionscheme/" + schemeId, {
      expand: "permissions"
    });
    console.log(`Fetched scheme ${schemeId}: name="${scheme.name}", ${(scheme.permissions || []).length} permissions`);
    return scheme;
  } catch (e) {
    console.warn(`v3 API failed for scheme ${schemeId}: ${e.message}`);
    try {
      // Fallback to v2 API
      const scheme = jiraFetch_("/rest/api/2/permissionscheme/" + schemeId);
      console.log(`Fetched scheme ${schemeId} via v2: name="${scheme.name}", ${(scheme.permissions || []).length} permissions`);
      return scheme;
    } catch (e2) {
      console.warn(`Failed to fetch permission scheme ${schemeId}: ${e2.message}`);
      return null;
    }
  }
}

// resolveUserByAccountId_ is in config.js

const projectRoleCache_ = {};

function resolveProjectRole_(roleId, projectKey) {
  if (!roleId || !projectKey) return roleId;
  const cacheKey = `${projectKey}_${roleId}`;
  if (projectRoleCache_[cacheKey]) return projectRoleCache_[cacheKey];
  
  try {
    const role = jiraFetch_("/rest/api/3/project/" + projectKey + "/role/" + roleId);
    const roleName = role.name || roleId;
    projectRoleCache_[cacheKey] = roleName;
    return roleName;
  } catch (e) {
    projectRoleCache_[cacheKey] = roleId;
    return roleId;
  }
}

function extractPeopleFromPermissionScheme_(schemeId, projectKey) {
  if (!schemeId) {
    console.log("No schemeId provided");
    return { name: "", people: [] };
  }

  const scheme = fetchPermissionScheme_(schemeId);
  if (!scheme) {
    console.log(`Failed to fetch scheme ${schemeId}`);
    return { name: "", people: [] };
  }

  const permissionSchemeName = scheme.name || "";
  const people = [];

  const permissions = scheme.permissions || [];

  permissions.forEach((perm) => {
    if (!perm.holder) {
      return;
    }

    const holder = perm.holder;
    const holderType = holder.type;

    // Handle users
    if (holderType === "user") {
      // For user type, parameter contains accountId
      const accountId = holder.accountId || holder.parameter;
      if (accountId) {
        const user = resolveUserByAccountId_(accountId);
        if (user) {
          people.push({
            name: user.name || user.email || user.accountId,
            type: "Person",
            permission: perm.permission || ""
          });
        }
      }
    }
    // Handle groups
    else if (holderType === "group") {
      // For group type, parameter contains group name
      const groupName = holder.parameter || holder.name || "";
      if (groupName) {
        people.push({
          name: groupName,
          type: "Group",
          permission: perm.permission || ""
        });
      }
    }
    // Handle project roles
    else if (holderType === "projectRole") {
      // For projectRole type, parameter contains role ID
      const roleId = holder.parameter || holder.value || "";
      if (roleId && projectKey) {
        const roleName = resolveProjectRole_(roleId, projectKey);
        people.push({
          name: roleName,
          type: "Project Role",
          permission: perm.permission || ""
        });
      }
    } else {
      // Skip unknown types (assignee, reporter, userCustomField, applicationRole, etc.)
      // They are not relevant for our audit
    }
  });

  return { name: permissionSchemeName, people: people };
}

function updateGroupsFromJiraApi() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName("Groups");
  if (!sh) throw new Error("Groups sheet missing. Run setupGroupSheet() first.");

  sh.clear();
  sh.clearFormats();

  sh.getRange("A1:H1").setValues([[
    "Space Name",
    "Space Key",
    "Board Name",
    "Board ID",
    "Space Owner",
    "Group",
    "Roles",
    "Permission Schema"
  ]]);

  const out = [];
  const projects = fetchAllProjects_();

  console.log(`Found ${projects.length} projects`);

  projects.forEach((project, index) => {
    const projectKey = project.key;
    const projectName = project.name;
    
    // Extract lead (Space Owner) from project
    const projectLead = project.lead 
      ? (project.lead.displayName || project.lead.accountId || "") 
      : "";
    
    // Extract permission scheme from project
    let permissionSchemeId = null;
    let permissionSchemeName = null;
    
    // Method 1: Try to get permission scheme via dedicated endpoint (most reliable)
    try {
      // Use the dedicated endpoint for project permission scheme
      const schemeResponse = jiraFetch_("/rest/api/3/project/" + projectKey + "/permissionscheme");
      if (schemeResponse) {
        permissionSchemeId = schemeResponse.id;
        permissionSchemeName = schemeResponse.name || "";
        if (index < 3) {
          console.log(`✓ Found permission scheme for ${projectKey} via endpoint: id=${permissionSchemeId}, name="${permissionSchemeName}"`);
        }
      }
    } catch (e) {
      // This endpoint might require special permissions or might not exist
      if (index < 3) {
        console.log(`✗ Direct permission scheme endpoint failed for ${projectKey}: ${e.message}`);
      }
    }
    
    // Method 2: Get all permission schemes and find the one used by this project
    if (!permissionSchemeId) {
      try {
        // Get all permission schemes
        const allSchemes = jiraFetch_("/rest/api/3/permissionscheme");
        const schemes = allSchemes.permissionSchemes || allSchemes.values || [];
        
        // Try to find which scheme is used by this project
        // We'll need to check each scheme's projects or use a different approach
        // For now, let's try to get it from project properties or use first available
        if (schemes.length > 0 && index < 3) {
          console.log(`Found ${schemes.length} permission schemes total`);
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Method 3: Try to get from project details with different expand
    if (!permissionSchemeId) {
      try {
        const projectDetails = jiraFetch_("/rest/api/3/project/" + projectKey);
        // Check if there's any reference to permission scheme in the response
        // Sometimes it might be in a different field
        if (projectDetails.properties) {
          // Check properties for permission scheme reference
          const props = projectDetails.properties;
          for (let key in props) {
            if (key.toLowerCase().includes('permission') || key.toLowerCase().includes('scheme')) {
              const value = props[key];
              const match = String(value).match(/permissionscheme[\/](\d+)/);
              if (match) {
                permissionSchemeId = parseInt(match[1]);
                break;
              }
            }
          }
        }
      } catch (e) {
        // Ignore
      }
    }
    
    // Method 4: Check if permissionScheme is in search response
    if (!permissionSchemeId && project.permissionScheme) {
      if (typeof project.permissionScheme === 'object' && project.permissionScheme.id) {
        permissionSchemeId = project.permissionScheme.id;
        permissionSchemeName = project.permissionScheme.name || "";
      } else if (typeof project.permissionScheme === 'string') {
        const match = project.permissionScheme.match(/permissionscheme[\/](\d+)/);
        if (match) {
          permissionSchemeId = parseInt(match[1]);
        }
      }
    }
    
    if (!permissionSchemeId) {
      console.warn(`No permission scheme found for project ${projectKey}`);
    } else {
      if (index < 3) {
        console.log(`Found permission scheme for ${projectKey}: id=${permissionSchemeId}, name="${permissionSchemeName}"`);
      }
    }

    // Fetch boards for this project
    const boards = fetchBoardsForProject_(projectKey);

    // Get project roles and groups (like in jyra_sync.js)
    const projectRoles = [];
    try {
      const roleMap = jiraFetch_("/rest/api/3/project/" + projectKey + "/role");
      for (let roleName in roleMap) {
        const roleObj = jiraFetchAbsolute_(roleMap[roleName]);
        roleObj.actors.forEach(actor => {
          if (actor.type === "atlassian-group-role-actor") {
            projectRoles.push({
              group: actor.name,
              role: roleName
            });
          }
        });
      }
    } catch (e) {
      console.warn(`Failed to get project roles for ${projectKey}: ${e.message}`);
    }

    // Group roles by group name
    const groupRolesMap = {};
    projectRoles.forEach(pr => {
      if (!groupRolesMap[pr.group]) {
        groupRolesMap[pr.group] = [];
      }
      groupRolesMap[pr.group].push(pr.role);
    });

    // Use scheme name from API
    const finalSchemeName = permissionSchemeName || "";

    // Log progress for debugging
    const groupCount = Object.keys(groupRolesMap).length;
    console.log(`Project ${projectKey}: ${boards.length} boards, ${groupCount} groups, scheme="${finalSchemeName}"`);
    if ((index + 1) % 10 === 0) {
      console.log(`Processing project ${index + 1}/${projects.length}: ${projectKey} (${boards.length} boards, ${groupCount} groups)`);
    }

    // Create rows: each board gets its own rows with all groups
    // Space Name/Key/Owner/Schema filled only in first row of project, empty for rest
    // Board Name/ID filled only in first row of each board, empty for rest
    let isFirstRowOfProject = true;
    
    if (boards.length === 0) {
      // No boards - create rows for groups
      if (groupCount === 0) {
        out.push([
          projectName,
          projectKey,
          "", // Board Name
          "", // Board ID
          projectLead,
          "", // Group
          "", // Roles
          finalSchemeName
        ]);
      } else {
        Object.keys(groupRolesMap).forEach(groupName => {
          const roles = groupRolesMap[groupName].sort().join(", ");
          out.push([
            isFirstRowOfProject ? projectName : "", // Space Name (only first row)
            isFirstRowOfProject ? projectKey : "", // Space Key (only first row)
            "", // Board Name
            "", // Board ID
            isFirstRowOfProject ? projectLead : "", // Space Owner (only first row)
            groupName, // Group
            roles, // Roles (comma-separated, sorted)
            isFirstRowOfProject ? finalSchemeName : "" // Permission Schema (only first row)
          ]);
          isFirstRowOfProject = false;
        });
      }
    } else {
      // Multiple boards - create rows for each board-group combination
      boards.forEach((board, boardIndex) => {
        const isFirstBoard = boardIndex === 0;
        let isFirstRowOfBoard = true;
        
        if (groupCount === 0) {
          // No groups, one row per board
          out.push([
            isFirstRowOfProject ? projectName : "", // Space Name (only first row of project)
            isFirstRowOfProject ? projectKey : "", // Space Key (only first row of project)
            isFirstRowOfBoard ? (board.name || "") : "", // Board Name (only first row of board)
            isFirstRowOfBoard ? (board.id || "") : "", // Board ID (only first row of board)
            isFirstRowOfProject ? projectLead : "", // Space Owner (only first row of project)
            "", // Group
            "", // Roles
            isFirstRowOfProject ? finalSchemeName : "" // Permission Schema (only first row of project)
          ]);
          isFirstRowOfProject = false;
        } else {
          // One row per group for this board
          Object.keys(groupRolesMap).forEach((groupName) => {
            const roles = groupRolesMap[groupName].sort().join(", ");
            out.push([
              isFirstRowOfProject ? projectName : "", // Space Name (only first row of project)
              isFirstRowOfProject ? projectKey : "", // Space Key (only first row of project)
              isFirstRowOfBoard ? (board.name || "") : "", // Board Name (only first row of board)
              isFirstRowOfBoard ? (board.id || "") : "", // Board ID (only first row of board)
              isFirstRowOfProject ? projectLead : "", // Space Owner (only first row of project)
              groupName, // Group
              roles, // Roles (comma-separated, sorted)
              isFirstRowOfProject ? finalSchemeName : "" // Permission Schema (only first row of project)
            ]);
            isFirstRowOfProject = false;
            isFirstRowOfBoard = false;
          });
        }
      });
    }
  });

  if (!out.length) {
    console.warn("Groups updated but no data returned");
    return;
  }

  // Normalize roles in all rows (sort them for consistency)
  out.forEach(row => {
    if (row[6]) {
      const roles = String(row[6] || "").trim().split(",").map(r => r.trim()).filter(r => r).sort().join(", ");
      row[6] = roles;
    }
  });

  // Remove duplicates based on: Space Key + Board ID + Group + Roles + Schema
  // But preserve order - only remove consecutive duplicates
  const uniqueOut = [];
  let lastKey = null;
  
  out.forEach(row => {
    const spaceKey = String(row[1] || "").trim();
    const boardId = String(row[3] || "").trim();
    const group = String(row[5] || "").trim();
    const roles = String(row[6] || "").trim();
    const schema = String(row[7] || "").trim();
    
    const key = `${spaceKey}|${boardId}|${group}|${roles}|${schema}`;
    
    // Only skip if it's exactly the same as previous row (consecutive duplicate)
    if (key !== lastKey) {
      uniqueOut.push(row);
      lastKey = key;
    }
  });

  sh.getRange(2, 1, uniqueOut.length, 8).setValues(uniqueOut);

  // Don't sort - preserve the order of projects as they were processed
  // Projects are already in correct order, sorting would mix empty cells

  sh.autoResizeColumns(1, 8);
  sh.setFrozenRows(1);

  console.log("Groups updated: " + uniqueOut.length + " unique rows (from " + out.length + " total)");
}

/**
 * Handle edits to the Groups sheet
 * Allows editing Board Name (column C) - changes are saved only in the sheet
 * Note: Board names in Jira cannot be easily updated via API, so changes are local only
 */
function onEditGroups(e) {
  if (!e || !e.range) return;
  
  const sh = e.range.getSheet();
  if (!sh || sh.getName() !== "Groups") return;
  
  const row = e.range.getRow();
  const col = e.range.getColumn();
  
  // Only track changes to Board Name (column C = 3)
  if (col === 3 && row > 1) {
    const oldValue = e.oldValue || "";
    const newValue = e.value || "";
    
    if (oldValue !== newValue) {
      console.log(`Board name changed in row ${row}: "${oldValue}" → "${newValue}"`);
      // Changes are automatically saved in the sheet
      // To sync back to Jira, you would need to implement board update API call here
    }
  }
}

