// Common functions and constants are in config.js

function fetchJiraGroupsWithMembers_() {
  const picker = jiraFetch_("/rest/api/3/groups/picker", { maxResults: 1000 });
  const groups = picker.groups || [];
  const rows = [];

  groups.forEach(g => {
    const groupName = g.name;
    let startAt = 0;

    while (true) {
      const resp = jiraFetch_("/rest/api/3/group/member", {
        groupname: groupName,
        startAt: startAt,
        maxResults: 50
      });

      const users = resp.values || [];
      if (!users.length) break;

      users.forEach(u => {
        rows.push({
          group: groupName,
          email: u.emailAddress || "",
          fullname: u.displayName || ""
        });
      });

      if (resp.isLast) break;
      startAt += 50;
    }
  });

  return rows;
}

function fetchJiraProjectRoleGroups_() {
  const rows = [];
  const proj = jiraFetch_("/rest/api/3/project/search", { maxResults: 1000 });
  const projects = proj.values || [];

  projects.forEach(p => {
    const map = jiraFetch_("/rest/api/3/project/" + p.key + "/role");
    for (let roleName in map) {
      const roleObj = jiraFetchAbsolute_(map[roleName]);
      roleObj.actors.forEach(a => {
        if (a.type === "atlassian-group-role-actor") {
          rows.push({ project: p.key, role: roleName, group: a.name });
        }
      });
    }
  });

  return rows;
}


function updateSourceFromJiraApi() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName("Source");
  if (!sh) throw new Error("Source sheet missing");

  const groupUsers = fetchJiraGroupsWithMembers_();
  const projectRoles = fetchJiraProjectRoleGroups_();

  sh.clear();
  sh.clearFormats();

  sh.getRange("A1:F1").setValues([["Name","Surname","Email","ProjectKey","Group","Role"]]);

  const out = [];

  projectRoles.forEach(pr => {
    const usersInGroup = groupUsers.filter(u => u.group === pr.group);

    usersInGroup.forEach(u => {
      if (!u.email) return;

      const parts = u.fullname.trim().split(" ");
      const name = parts.shift() || "";
      const surname = parts.join(" ");

      out.push([
        name,
        surname,
        u.email,
        pr.project,
        pr.group,
        pr.role
      ]);
    });
  });

  if (!out.length) {
    console.warn("Jira Source updated but no data returned");
    return;
  }

  sh.getRange(2, 1, out.length, 6).setValues(out);

  sh.getRange(2, 1, out.length, 6).sort([
    { column: 4, ascending: true },
    { column: 2, ascending: true },
    { column: 1, ascending: true }
  ]);

  sh.autoResizeColumns(1, 6);
  sh.setFrozenRows(1);

  console.log("Jira Source updated: " + out.length + " rows");
}
